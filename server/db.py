import os
from dotenv import load_dotenv
import json
import firebase_admin
from firebase_admin import credentials, firestore
import numpy as np

class FirebaseClient:
    def __init__(self):
        load_dotenv()
        firebase_creds_json = os.getenv('FIREBASEKEY_CREDENTIALS')
        firebase_creds = json.loads(firebase_creds_json)
        cred = credentials.Certificate(firebase_creds)

        firebase_admin.initialize_app(cred)
        self.db = firestore.client()

    def get_random_prompts(self, use_case, n=2):
        prompts = self.db.collection('prompt').where('use_case', '==', use_case).stream()
        assistants = self.db.collection('assistants').where('use_case', '==', use_case).stream()
        
        prompts_list = [p.to_dict() for p in prompts]
        assistants_list = [a.to_dict() for a in assistants]

        latest_prompts = {}
        for prompt in prompts_list:
            origin = prompt.get('origin')
            if origin and (origin not in latest_prompts or latest_prompts[origin].get('version', 0) < prompt.get('version', 0)):
                latest_prompts[origin] = prompt

        latest_assistants = {}
        for assistant in assistants_list:
            origin = assistant.get('origin')
            if origin and (origin not in latest_assistants or latest_assistants[origin].get('version', 0) < assistant.get('version', 0)):
                latest_assistants[origin] = assistant

        combined_list = list(latest_prompts.values()) + list(latest_assistants.values())

        model_play_counts = {item.get('origin'): 0 for item in combined_list if 'origin' in item}
        total_games_ref = self.db.collection('total_games').document('total')
        total_games_doc = total_games_ref.get()

        total_games = total_games_doc.to_dict().get('total_games', 0) if total_games_doc.exists else 0

        for item in combined_list:
            origin = item.get('origin')
            if origin:
                model_ref = self.db.collection('elo').document(origin).get()
                if model_ref.exists:
                    model_play_counts[origin] = model_ref.to_dict().get('no_of_games', 0)

        if total_games == 0:
            probabilities = {model: 1 for model in model_play_counts}
        else:
            probabilities = {model: 1 - (count / total_games) for model, count in model_play_counts.items()}

        models = list(probabilities.keys())
        weights = list(probabilities.values())
        
        if len(models) < n:
            selected_models = np.random.choice(models, size=n, replace=True)
        else:
            selected_models = np.random.choice(models, size=n, replace=False, p=[w / sum(weights) for w in weights])

        selected_prompts = [item for item in combined_list if item.get('origin') in selected_models]
        result = []
        for item in selected_prompts:
            if 'assistant_id' in item:
                result.append({
                    'assistant_id': item.get('assistant_id', ''),
                    'assistant_apikey': item.get('assistant_apikey', ''),
                    'origin': item.get('origin', ''),
                    'use_case': item.get('use_case', ''),
                    'assistant_version': item.get('assistant_version', ''),
                    'version': item.get('version', '')
                })
            else:
                result.append({
                    'origin': item.get('origin', ''),
                    'prompt': item.get('prompt', ''),
                    'use_case': item.get('use_case', ''),
                    'version': item.get('version', '')
                })

        return result

    def add_response(self, response_data):
        self.db.collection('responses').add(response_data)

    def add_use_case(self, use_case_data):
        self.db.collection('use_cases').add(use_case_data)

    def calculate_elo(self, current_rating, opponent_rating, score, k=30):
        expected_score = 1 / (1 + 10 ** ((opponent_rating - current_rating) / 400))
        new_rating = current_rating + k * (score - expected_score)
        return new_rating

    def update_elo(self, elo_result):
        try:

            model_a_name = elo_result['model_a']
            model_b_name = elo_result['model_b']
            result = elo_result["result"]
            model_a_ref = self.db.collection('elo').document(model_a_name)
            model_b_ref = self.db.collection('elo').document(model_b_name)

            model_a = model_a_ref.get()
            model_b = model_b_ref.get()

            initial_score = 1600

            if model_a.exists:
                model_a_data = model_a.to_dict()
                model_a_rating = model_a_data['score']
            else:
                model_a_rating = initial_score
                model_a_data = {
                    'model_name': model_a_name,
                    'no_of_games': 0,
                    'score': model_a_rating
                }

            if model_b.exists:
                model_b_data = model_b.to_dict()
                model_b_rating = model_b_data['score']
            else:
                model_b_rating = initial_score
                model_b_data = {
                    'model_name': model_b_name,
                    'no_of_games': 0,
                    'score': model_b_rating
                }

            if result == "win":
                model_a_new_rating = self.calculate_elo(model_a_rating, model_b_rating, 1)
                model_b_new_rating = self.calculate_elo(model_b_rating, model_a_rating, 0)
            elif result == "loss":
                model_a_new_rating = self.calculate_elo(model_a_rating, model_b_rating, 0)
                model_b_new_rating = self.calculate_elo(model_b_rating, model_a_rating, 1)
            elif result == "both_good":
                model_a_new_rating = self.calculate_elo(model_a_rating, model_b_rating, 0.75)
                model_b_new_rating = self.calculate_elo(model_b_rating, model_a_rating, 0.75)
            elif result == "both_bad":
                model_a_new_rating = self.calculate_elo(model_a_rating, model_b_rating, 0.25)
                model_b_new_rating = self.calculate_elo(model_b_rating, model_a_rating, 0.25)

            model_a_data['score'] = model_a_new_rating
            model_a_data['no_of_games'] += 1
            model_b_data['score'] = model_b_new_rating
            model_b_data['no_of_games'] += 1

            model_a_ref.set(model_a_data)
            model_b_ref.set(model_b_data)

            self.increment_total_games()

        except Exception as e:
            print(f"Error updating ELO: {e}")

    def increment_total_games(self):
        total_games_ref = self.db.collection('total_games').document('total')
        total_games_doc = total_games_ref.get()

        if total_games_doc.exists:
            total_games = total_games_doc.to_dict().get('total_games', 0) + 1
        else:
            total_games = 1

        total_games_ref.set({'total_games': total_games}, merge=True)
        return total_games

    def add_or_update_prompt(self, prompt_data):
        origin = prompt_data['origin']
        use_case = prompt_data['use_case']
        
        existing_prompts = self.db.collection('prompt').where('origin', '==', origin).where('use_case', '==', use_case).stream()
        versions = [p.to_dict()['version'] for p in existing_prompts]

        if versions:
            new_version = max(versions) + 1
        else:
            new_version = 1

        prompt_data['version'] = new_version
        self.db.collection('prompt').add(prompt_data)

    def add_or_update_use_case(self, use_case_name):
        existing_use_cases = self.db.collection('use_cases').where('name', '==', use_case_name).stream()
        if not any(existing_use_cases):
            self.db.collection('use_cases').add({'name': use_case_name})

    def add_or_update_assistant(self, assistant_data):
        use_case = assistant_data['use_case']
        
        existing_assistants = self.db.collection('assistants').where('use_case', '==', use_case).stream()
        versions = [a.to_dict()['version'] for a in existing_assistants]

        if versions:
            new_version = max(versions) + 1
        else:
            new_version = 1

        assistant_data['origin'] = "Conva Assistant"
        assistant_data['version'] = new_version
        self.db.collection('assistants').add(assistant_data)

    def fetch_models(self):
        models = set()
        prompts = self.db.collection('prompt').stream()
        for prompt in prompts:
            models.add(prompt.to_dict().get('origin', ''))
        return list(models)

    def fetch_use_cases(self):
        use_cases = set()
        prompts = self.db.collection('use_cases').stream()
        for prompt in prompts:
            use_cases.add(prompt.to_dict().get('name', ''))
        return list(use_cases)


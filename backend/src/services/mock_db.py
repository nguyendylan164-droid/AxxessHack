""" mock database for testing purposes  - loads users and EMR reports from json files """

import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent.parent / 'data'
USERS_PATH = DATA_DIR / 'mock_users.json'
EMR_REPORTS_PATH = DATA_DIR / 'mock_emr_reports.json'

def load_json(path: str):
    """ load json file from path and return as dict """
    with open(path, 'r') as f:
        return json.load(f)
    
def get_users() -> list:
    """ get users from json file """
    return load_json(USERS_PATH)

def get_emr_by_user_id(user_id: str) -> dict|None:
    """ get EMR report for user by user id """
    emr_reports = load_json(EMR_REPORTS_PATH)
    for report in emr_reports:
        if report['user_id'] == user_id:
            return report
    return None

def get_user_by_id(user_id: str) -> dict|None:
    """ get user by user id """
    users = load_json(USERS_PATH)
    for user in users:
        if user['id'] == user_id:
            return user
    return None
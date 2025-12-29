from enum import Enum 

class ChatMode(str , Enum):
    STANDARD = "standard"
    WEB_SEARCH = "web_search"
    FILE_SEARCH = "file_search"

class SearchCategory(str , Enum):
    PEOPLE = "people"
    COMPANY = "company"

class CardType(str , Enum):
    PERSON = "person"
    COMPANY = "company"

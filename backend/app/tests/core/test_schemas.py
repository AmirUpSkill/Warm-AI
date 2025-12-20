import pytest
from pydantic import ValidationError
from app.schemas.search import PersonCard
from app.schemas.common import CardType

def test_person_card_valid():
    data = {
        "name": "Amir UpSkill",
        "linkedin_url": "https://linkedin.com/in/amir",
        "skills": ["Python", "FastAPI"]
    }
    card = PersonCard(**data)
    assert card.name == "Amir UpSkill"
    assert card.card_type == CardType.PERSON

def test_person_card_invalid_url():
    with pytest.raises(ValidationError):
        PersonCard(name="Amir", linkedin_url="not-a-url")
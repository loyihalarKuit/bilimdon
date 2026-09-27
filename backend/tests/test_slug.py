from app.services.slug import slugify


def test_slugify_uzbek():
    assert slugify("O‘zbek tili: boshlang'ich") == "ozbek-tili-boshlangich"
    assert slugify("Ҳисоб-китоб") == "hisob-kitob"
    assert slugify("!!!") == "item"

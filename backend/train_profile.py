import pandas as pd
import joblib

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier

data = [

# =====================
# Developer
# =====================

["github leetcode stackoverflow python", "Developer"],
["react nodejs express docker", "Developer"],
["openai huggingface transformers llm", "Developer"],
["aws kubernetes microservices backend", "Developer"],
["javascript typescript nextjs frontend", "Developer"],
["spring boot java mysql", "Developer"],
["cpp competitive programming codeforces", "Developer"],
["git github pull requests", "Developer"],
["linux ubuntu bash terminal", "Developer"],
["mongodb postgres database design", "Developer"],
["tensorflow pytorch machine learning", "Developer"],
["rest api graphql backend", "Developer"],
["software architecture design patterns", "Developer"],
["redis caching distributed systems", "Developer"],
["devops ci cd deployment", "Developer"],
["cloud computing azure gcp", "Developer"],
["algorithms data structures", "Developer"],
["system design scalability", "Developer"],
["open source contributors github", "Developer"],
["vs code programming tutorials", "Developer"],

# =====================
# Gamer
# =====================

["steam valorant csgo twitch", "Gamer"],
["playstation xbox esports gaming", "Gamer"],
["minecraft gaming discord", "Gamer"],
["fortnite battle royale gaming", "Gamer"],
["call of duty multiplayer", "Gamer"],
["gaming laptop gpu benchmark", "Gamer"],
["nvidia gaming graphics cards", "Gamer"],
["twitch streamers esports", "Gamer"],
["elden ring walkthrough", "Gamer"],
["league of legends ranked", "Gamer"],
["gaming mouse keyboard setup", "Gamer"],
["fps games esports", "Gamer"],
["xbox game pass", "Gamer"],
["pc gaming hardware", "Gamer"],
["gaming communities discord", "Gamer"],

# =====================
# Student
# =====================

["instagram tiktok snapchat reels", "Student"],
["youtube netflix spotify memes", "Student"],
["coursera udemy online courses", "Student"],
["college assignments exams", "Student"],
["geeksforgeeks interview preparation", "Student"],
["student discounts laptops", "Student"],
["study notes lecture slides", "Student"],
["university classes attendance", "Student"],
["internship applications students", "Student"],
["campus placements preparation", "Student"],
["online education learning", "Student"],
["academic projects reports", "Student"],
["hostel campus life", "Student"],
["student productivity apps", "Student"],
["study techniques revision", "Student"],

# =====================
# Crypto
# =====================

["coinbase robinhood crypto stocks", "CryptoEnthusiast"],
["bitcoin ethereum trading defi", "CryptoEnthusiast"],
["crypto wallets blockchain", "CryptoEnthusiast"],
["binance crypto exchange", "CryptoEnthusiast"],
["altcoins market analysis", "CryptoEnthusiast"],
["web3 decentralized finance", "CryptoEnthusiast"],
["crypto trading signals", "CryptoEnthusiast"],
["ethereum smart contracts", "CryptoEnthusiast"],
["staking yield farming", "CryptoEnthusiast"],
["bitcoin price prediction", "CryptoEnthusiast"],
["blockchain technology crypto", "CryptoEnthusiast"],
["crypto market cap", "CryptoEnthusiast"],
["nft marketplaces web3", "CryptoEnthusiast"],
["metamask wallets", "CryptoEnthusiast"],
["decentralized applications", "CryptoEnthusiast"],

# =====================
# Tech Buyer
# =====================

["amazon shopping gadgets ecommerce", "TechBuyer"],
["apple samsung laptop reviews", "TechBuyer"],
["best smartphone comparison", "TechBuyer"],
["electronics buying guides", "TechBuyer"],
["smartwatch reviews comparison", "TechBuyer"],
["headphones earbuds reviews", "TechBuyer"],
["tech youtube reviewers", "TechBuyer"],
["amazon gadgets electronics", "TechBuyer"],
["premium laptops ultrabooks", "TechBuyer"],
["best monitors productivity", "TechBuyer"],
["consumer electronics deals", "TechBuyer"],
["tablet buying guide", "TechBuyer"],
["smart home devices", "TechBuyer"],
["latest gadgets launches", "TechBuyer"],
["tech product reviews", "TechBuyer"],

# =====================
# Lifestyle Buyer
# =====================

["travel hotels flights booking", "LifestyleBuyer"],
["cooking recipes fitness wellness", "LifestyleBuyer"],
["healthy meal preparation", "LifestyleBuyer"],
["vacation planning resorts", "LifestyleBuyer"],
["gym workout routines", "LifestyleBuyer"],
["nutrition diet plans", "LifestyleBuyer"],
["yoga mindfulness meditation", "LifestyleBuyer"],
["luxury travel experiences", "LifestyleBuyer"],
["fashion lifestyle shopping", "LifestyleBuyer"],
["home decor inspiration", "LifestyleBuyer"],
["wellness self improvement", "LifestyleBuyer"],
["healthy recipes cooking", "LifestyleBuyer"],
["fitness trackers health", "LifestyleBuyer"],
["travel destinations reviews", "LifestyleBuyer"],
["lifestyle blogs wellness", "LifestyleBuyer"]

]

df = pd.DataFrame(
    data,
    columns=["history","profile"]
)

model = Pipeline([
    ("tfidf",TfidfVectorizer()),
    ("rf",RandomForestClassifier(
        n_estimators=100,
        random_state=42
    ))
])

model.fit(
    df["history"],
    df["profile"]
)

joblib.dump(
    model,
    "backend/profile_model.pkl"
)

print("Profile model trained")
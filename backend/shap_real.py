import sys
import json
import joblib
import shap

model = joblib.load(
    "backend/profile_model.pkl"
)

text = sys.argv[1]

vectorizer = model.named_steps[
    "tfidf"
]

rf = model.named_steps[
    "rf"
]

X = vectorizer.transform(
    [text]
)

explainer = shap.TreeExplainer(
    rf
)

shap_values = explainer.shap_values(
    X.toarray()
)

feature_names = (
    vectorizer
    .get_feature_names_out()
)

pairs = []

try:

    values = shap_values[0][0]

except:

    values = shap_values[0]

for idx,val in enumerate(values):

    if abs(val) > 0:

        pairs.append({
            "feature":
            feature_names[idx],

            "impact":
            round(
                float(abs(val)),
                4
            )
        })

pairs = sorted(
    pairs,
    key=lambda x:
      x["impact"],
    reverse=True
)

print(
 json.dumps(
   pairs[:10]
 )
)
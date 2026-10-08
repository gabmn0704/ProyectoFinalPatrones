# EpiSafe AI: On-Device Models

## What is implemented

EpiSafe has two separate on-device models:

- The **logistic-regression association model**, implemented in TypeScript in `frontend/src/lib/riskEngine.ts`, analyzes the user's recorded check-ins.
- The **SmolLM2 135M Instruct** language model, loaded with Transformers.js and ONNX Runtime from `frontend/src/lib/assistantModel.worker.ts`, powers the EpiSafe Guide chat. It runs with the CPU/WASM backend inside a browser Web Worker and does not call an inference API.

The chat downloads its quantized model files from Hugging Face on first use (roughly 120 MB). Transformers.js caches downloaded files in the browser for later sessions where browser storage permits. A user needs a compatible modern browser, a reliable initial connection, and adequate device memory. Inference uses CPU/WASM rather than device-specific GPU acceleration for broader compatibility, so responses may take longer. Model responses may be simpler or less reliable than responses from a larger hosted model.

The model learns from one person's recorded daily check-ins and seizure-event days. It estimates an experimental 0–100 association signal for the factors in today's check-in based on patterns in that person's past records. The number is a model score, **not a probability or medical risk estimate**.

## Inputs and labels

The model uses four binary, human-readable features:

| Feature | Recorded condition |
| --- | --- |
| Short sleep | Fewer than 5 hours |
| Medication | Medication marked as not taken |
| Elevated stress | Stress level of 4 or 5 on the 1–5 scale |
| Higher caffeine | 3 or more cups |

A logged calendar day is labeled positive if at least one seizure event was recorded on that date. Other logged days are treated as days without a *recorded* seizure. Days without a check-in are excluded rather than treated as negative examples.

## Training and safeguards

- Training uses at most the most recent 90 calendar days, excluding today to avoid training on the current check-in.
- The model stays on transparent starter rules until the history contains at least 30 prior check-ins, 5 recorded seizure days, and 15 logged days without a recorded seizure.
- Training uses regularized binary logistic regression, a smoothed empirical starting intercept, bounded logits, and fixed-step batch gradient descent. It retrains locally from the stored history when the dashboard is calculated.
- The interface shows the model type and the number of records used. It explicitly states that the result is not a probability, forecast, diagnosis, or medical advice.
- The chat prompt and conversation history stay on the device; they are not sent to an inference provider. The browser does contact Hugging Face to download model files on first use.
- In the current beta, health records and the assistant conversation remain in browser local storage.

## Important limitations

This is an educational prototype, not a clinically validated seizure-prediction system. Self-reported data can be incomplete, dates do not prove that a factor preceded an event, and small personal datasets can produce spurious or unstable associations. A logged day without an event is not proof that no event occurred. The score must not be used to change medication, make safety decisions, or replace a clinician's advice or emergency services.

The sample records in the interactive beta are fictional demonstration data. They are not the current user's health history and should not be used to assess an individual.

## Data-structures assignment

The learning model uses compact arrays for fixed numeric features and gradient calculations. The surrounding analysis engine also uses the project's linked list, hash map, binary search tree, and priority queue for ordered history, event-day indexing, and ranking observed factor associations.

## Verification

`frontend/src/lib/riskEngine.test.ts` verifies that the model stays in starter mode below the evidence threshold and learns a stronger association for a factor that is consistently present on recorded event days in a synthetic test dataset. That test validates software behavior only; it is not clinical evidence.

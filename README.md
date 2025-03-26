# pyterrier-frontend
Implementation of my current dissertation project, using PyTerrier to find relevant background links for a given article

# Docker
You will need to create a docker container in order for the backend to work. This should be relatively straightforward as I have
made a `Dockerfile` and `requirements.txt` file. You can just run the command `docker build -t backend .` in the root (provided
you have docker open) to create a container called "backend" which can then be run using `docker run -p 5000:5000 -v ~\path\to\~\pyterrier-frontend\ir_datasets:/root/.ir_datasets -v ~\path\to\~\pyterrier-frontend\App.py:/app/App.py backend` on port 5000. I have downloaded the WashingtonPost.v2 dataset, so if you are running this on a different machine then replace the directory before the colon with wherever your WashingtonPost.v2.tar.gz file is

# Llama API
If using the LLM summarisation option, you will need to acquire an Openrouter API Key following the steps from this website: https://openrouter.ai/settings/keys. Once you have obtained one, create a `.env` file in the root and add the line `OPENAI_API_KEY="YOUR TOKEN HERE"`.

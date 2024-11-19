FROM python:3.10-slim

# Install Java
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk && \
    apt-get clean;

# Set JAVA_HOME environment variable
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . /app
WORKDIR /app

EXPOSE 5000
CMD ["python", "App.py"]

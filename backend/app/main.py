from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Hello, Persona Bot"}


@app.get("/hello/{name}")
def say_hello(name: str, excited: bool = False):
    if excited:
        return {"greeting": f"Hello, {name}!"}
    return {"greeting": f"Hello, {name}"}

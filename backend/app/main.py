from fastapi import FastAPI
from scalar_fastapi import add_scalar_reference

app = FastAPI()
add_scalar_reference(app)


@app.get("/")
def read_root():
    return {"message": "Hello, Persona Bot"}


@app.get("/hello/{name}")
def say_hello(name: str, excited: bool = False):
    if excited:
        return {"greeting": f"Hello, {name}!"}
    return {"greeting": f"Hello, {name}"}
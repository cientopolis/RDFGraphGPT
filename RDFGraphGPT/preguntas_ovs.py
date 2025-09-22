from typing import List


class PreguntaOVS:
    def __init__(self, id: str, pregunta: str, query: str, respuesta: str, grafo: str):
        self.id = id
        self.pregunta = pregunta
        self.query = query
        self.respuesta = respuesta
        self.grafo = grafo

    def __repr__(self) -> str:
        return (
            f"PreguntaOVS(id='{self.id}', "
            f"pregunta='{self.pregunta}', "
            f"query='{self.query}', "
            f"respuesta='{self.respuesta}', "
            f"grafo='{self.grafo[:30]}...')"  # corto el grafo por si es largo
        )

    def to_dict(self) -> dict:
        """Devuelve la instancia como diccionario."""
        return {
            "id": self.id,
            "pregunta": self.pregunta,
            "query": self.query,
            "respuesta": self.respuesta,
            "grafo": self.grafo,
        }
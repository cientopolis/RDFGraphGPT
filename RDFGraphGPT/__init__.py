from openai import OpenAI
import rdflib
import pygraphviz as pgv
import os
import subprocess
from flask import url_for

import os

# Define la ruta base de tu proyecto
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Define la ruta a la carpeta static
STATIC_DIR = os.path.join(BASE_DIR, 'static')

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

text_example = "Jesus Txus Gómez Vidorreta (born 20 June 1966) is a Spanish professional basketball coach, currently managing Lenovo Tenerife of the Spanish Liga ACB and the Basketball Champions League.[1] Vidorreta, born in Bilbao, has coached several teams in Spain.He has been most successful as the head coach of Canarias, he has won two Basketball Champions League titles, in 2017 and 2022, as well as one FIBA Intercontinental Cup title in 2023."
rdf_example = """
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix dbo: <http://dbpedia.org/ontology/> .
@prefix dbr: <http://dbpedia.org/resource/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix lifia: <http://lifia.ar/ontology/> .

dbr:Txus_Vidorreta rdf:type (dbo:Person dbo:Coach) ;
    dbo:birthDate "1966-06-20"^^xsd:date ;
    dbo:birthPlace dbr:Bilbao ;
    dbo:nationality dbr:Spain ;
    dbo:occupation dbr:Basketball_coach ;
    dbo:team dbr:Lenovo_Tenerife ;
    lifia:manages lifia:Lenovo_Tenerife
    lifia:hasWon (lifia:Basketball_Champions_League_2017 lifia:Basketball_Champions_League_2022 lifia:FIBA_Intercontinental_Cup_2023) .

dbr:Lenovo_Tenerife rdf:type dbo:BasketballTeam ;
    dbo:location dbr:Tenerife ;
    dbo:league dbr:Liga_ACB .

dbr:Basketball_Champions_League rdf:type dbo:SportsLeague ;
    dbo:sport dbr:Basketball .

lifia:FIBA_Intercontinental_Cup_2023 rdf:type dbo:Tournament ;
    dbo:year "2023"^^xsd:gYear ;
    dbo:sport dbr:Basketball .

lifia:Basketball_Champions_League_2017 rdf:type dbo:Tournament ;
    dbo:year "2017"^^xsd:gYear ;
    dbo:sport dbr:Basketball .

lifia:Basketball_Champions_League_2022 rdf:type dbo:Tournament ;
    dbo:year "2022"^^xsd:gYear ;
    dbo:sport dbr:Basketball ."
    
dbo:Person rdf:type rdf:Class .
dbo:Coach rdf:type rdf:Class .
dbo:Tournament rdf:type rdf:Class .
dbo:birthDate rdf:type rdf:Property .
dbo:birthPlace rdf:type rdf:Property

"""
#funcion para pasar a dot
def rdf_to_dot(rdf_file, dot_file):
    # Crear un nuevo grafo RDF    
    g = rdflib.Graph()
    try:
        # Cargar el archivo RDF
        g.parse(rdf_file, format='ttl')
    except Exception as e:
        return f"Error parsing RDF file: {e}"

    try:
        # Crear un nuevo grafo dirigido con pygraphviz
        dot = pgv.AGraph(strict=False, directed=True)

        # Iterar sobre los triples en el grafo RDF
        for subj, pred, obj in g:
            # Agregar nodos y aristas al grafo
            dot.add_node(str(subj), label=str(subj))
            dot.add_node(str(obj), label=str(obj))
            dot.add_edge(str(subj), str(obj), label=str(pred))
        
    except Exception as e:
        return f"Error creating the graph: {e}"

    # Guardar el grafo en formato DOT
    try:
        # Guardar el grafo en formato DOT
        dot.write(dot_file)
    except Exception as e:
        return f"Error writing DOT file: {e}"

    # try:
    #     # Visualizar el grafo
    #     dot.layout(prog='dot')
    #     dot.draw('pruebas_gpt4/outputImages/output.png')
    # except Exception as e:
    #     print(f"Error visualizing the graph: {e}")
        
def generate_graph(text, api_key, place, file_name):
    filename = file_name + ".ttl"

    # Define the directory and file path
    directory = "results"
    # file_name = "output.ttl"
    file_path = os.path.join(directory, filename)

    # Create the directory if it doesn't exist
    if not os.path.exists(directory):
        os.makedirs(directory)
        
    response = api_fetch(text)
    
    # Write to the file 
    if(place == "DIFFERENT"):
        with open(file_path, "w") as file:
            file.write(response.choices[0].message.content)
    else:
        with open(file_path, "a") as file:
            file.write(response.choices[0].message.content)

    rdf_file = 'results/' + filename
    dot_file = 'results/archivo.dot'

    exception = rdf_to_dot(rdf_file, dot_file)
    
    if exception:
        return exception
    else:
        svg_file = os.path.join(STATIC_DIR, 'archivo.svg')
        subprocess.run(['dot', '-Tsvg', dot_file, '-o', svg_file])

def generate_graph_having_rdf(rdf_text, place, file_name):
    if (place == "DIFFERENT"):
        filename = file_name + ".ttl"
    else:
        filename = file_name + ".ttl" #Aca despues tengo que agregar el select de los que ya existen

    # Define the directory and file path
    directory = "results"
    # file_name = "output.ttl"
    file_path = os.path.join(directory, filename)

    # Create the directory if it doesn't exist
    if not os.path.exists(directory):
        os.makedirs(directory)
        
    with open(file_path, "w") as file:
        file.write(rdf_text)

    rdf_file = 'results/' + filename
    dot_file = 'results/archivo.dot'

    exception = rdf_to_dot(rdf_file, dot_file)
    
    if exception:
        return exception
    else:
        svg_file = os.path.join(STATIC_DIR, 'archivo.svg')
        subprocess.run(['dot', '-Tsvg', dot_file, '-o', svg_file])
        
def graph_from_file(file_name):
    rdf_file = 'results/' + file_name + '.ttl'
    dot_file = 'results/archivo.dot'

    exception = rdf_to_dot(rdf_file, dot_file)
    
    if exception:
        return exception
    else:
        svg_file = os.path.join(STATIC_DIR, 'archivo.svg')
        subprocess.run(['dot', '-Tsvg', dot_file, '-o', svg_file])

def api_fetch(text):
    response = client.chat.completions.create(
    model="gpt-4-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful RDF turtle format expert. You know how to use clasess, properties and collections."},
        {"role": "system", "content": "You help translating natural text into rdf turtle format graphs. The explanation of it is not needed."},
        {"role": "system", "content": "You use wikidata or dbpedia terms whenever you can. Otherwise you use this URI: http://lifia.ar/ontology/ ."},
        {"role": "user", "content": "Please translate this natural languaje text into RDF turtle format: "+text_example },
        {"role": "assistant", "content": rdf_example},
        {"role": "user", "content": "Please translate this natural languaje text into RDF turtle format: "+text }
    ]
    )
    return response
    # +" Please just translate the text, don't add any extra information; and when the response ends, put the string eof."


def api_fetch_mejorada(text):
    # PROBAR Y DETERMINAR SI DEVUELVE MEJORES RDF !!
    system_prompt = f"""
    You are an expert data engineer specializing in knowledge graphs. 
    Your task is to convert unstructured text into a structured RDF graph using the Turtle (.ttl) syntax.

    Follow these rules STRICTLY:
    1.  **Output Format**: Your response MUST only contain the raw RDF Turtle code. Do not include any explanations, comments, or introductory text like "Here is the RDF code:".
    2.  **Prefixes**: Always use the following standard prefixes:
        - `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .`
        - `@prefix dbo: <http://dbpedia.org/ontology/> .`
        - `@prefix dbr: <http://dbpedia.org/resource/> .`
        - `@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .`
        - `@prefix lifia: <https://raw.githubusercontent.com/cientopolis/OVS-inmontology/refs/heads/main/inmontology.owl> .`
    3.  **Vocabulary**: Prioritize using terms from `dbo:` (DBpedia Ontology) and `dbr:` (DBpedia Resource) whenever possible. If a suitable term does not exist, use the `lifia:` prefix.
    4.  **Entity Naming**: Convert multi-word entities into `dbr:CamelCase` format (e.g., "Lenovo Tenerife" becomes `dbr:Lenovo_Tenerife`).
    5.  **Data Types**: Use appropriate XSD datatypes for literal values, especially for dates (`xsd:date`), numbers (`xsd:integer`), and years (`xsd:gYear`).
    """

    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text_example},
            {"role": "assistant", "content": rdf_example},
            {"role": "user", "content": text}
        ]
    )
    return response

def search_file(file_name):
    directory = "results"
    file_path = os.path.join(directory, file_name + ".ttl")
    if os.path.exists(file_path):
        # Read the file content
        with open(file_path, "r") as file:
            return file.read()
    else:
        return False
    
def get_files_in_directory(directory_path):
    """
    Retorna una lista de todos los nombres de archivos en el directorio especificado.
    
    Args:
    directory_path (str): Ruta del directorio.
    
    Returns:
    list: Lista de nombres de archivos en el directorio.
    """
    # Lista para almacenar los nombres de archivos
    files = []

    try:
        # Recorre todos los elementos en el directorio
        for item in os.listdir(directory_path):
            # Obtiene la ruta completa del elemento
            full_path = os.path.join(directory_path, item)
            
            # Verifica si el elemento es un archivo
            if (os.path.isfile(full_path) and item.endswith(".ttl")):
                files.append(str(item).rsplit('.', 1)[0])

    except Exception as e:
        print(f"Ocurrió un error al listar los archivos: {e}")

    return files
    
def save_file(file_name, rdf_text):
    directory = "results"
    file_path = os.path.join(directory, file_name + ".ttl")
    
    # Write to the file
    with open(file_path, "w") as file:
        file.write(rdf_text)
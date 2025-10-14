from typing import List
from flask import Flask, request, render_template, url_for
from RDFGraphGPT import generate_graph, generate_graph_having_rdf, search_file, get_files_in_directory, generate_ovs_graph
from RDFGraphGPT import graph_from_file as gff
import os

from RDFGraphGPT.preguntas_ovs import PreguntaOVS

app = Flask(__name__)
app.config["DEBUG"] = True
nombre_grafo = "grafo_la_plata_mini"

@app.route("/", methods=["GET", "POST"])
def graph():
    if request.method == "POST":
        # Obtiene los datos del formulario
        form_data = request.form
        text = form_data.get('text')
        place = "DIFFERENT"
        file_name = form_data.get('file-name')
        svg_url = url_for('static', filename='archivo.svg')
        
        exception = generate_graph(text, place, file_name)
        
        if exception:
            rdf_text = search_file(file_name)
            files = get_files_in_directory("results")
            return render_template('edit.html', rdf_text=rdf_text, error=exception, files=files)
        else:
            return render_template('graph.html', graph=svg_url)
        
    return render_template('index.html')


@app.post("/save-rdf")
def save():
    form_data = request.form
    file_name = form_data.get('file-name')
    rdf_text = form_data.get('rdf-text')
    
    place="SAME"
 
    svg_url = url_for('static', filename='archivo.svg')
    exception = generate_graph_having_rdf(rdf_text, place, file_name)
        
    if exception:
        files = get_files_in_directory("results")
        return render_template('edit.html', rdf_text=rdf_text, error=exception, files=files)
    else:
        return render_template('graph.html', graph=svg_url)

    
@app.route("/existent", methods=["GET", "POST"])
def graph_existent():
    files = get_files_in_directory("results")
    if request.method == "POST":
        # Obtiene los datos del formulario
        form_data = request.form
        text = form_data.get('text')
        place = "SAME"
        file_name = form_data.get('file-name')
        svg_url = url_for('static', filename='archivo.svg')
        
        exception = generate_graph(text, place, file_name)
        
        if exception:
            rdf_text = search_file(file_name)
            return render_template('edit.html', rdf_text=rdf_text, error=exception, files=files)
        else:
            return render_template('graph.html', graph=svg_url)
    
    return render_template('existent.html', files=files)

@app.route("/graph-from-file", methods=["GET", "POST"])
def graph_from_file():
    files = get_files_in_directory("results")
    if request.method == "POST":
        form_data = request.form
        file_name = form_data.get('file-name')
        rdf_text = search_file(file_name)
        
        place = "SAME"
        svg_url = url_for('static', filename='archivo.svg')
        exception = gff(file_name)
        
        if exception:
            return render_template('edit.html', rdf_text=rdf_text, error=exception, files=files)
        else:
            return render_template('from_file.html', files=files,graph=svg_url)
        
    return render_template('from_file.html', files=files)

@app.route("/ovs_home", methods=["GET"])
def ovs_home():
    files = get_files_in_directory("results")
    rdf_text = search_file(nombre_grafo)
    
    place = "SAME"
    svg_url = url_for('static', filename='archivo.svg')
    exception = gff(nombre_grafo)

    if exception:
        return render_template('edit.html', rdf_text=rdf_text, error=exception, files=files)
    else:
        return render_template('ovs_home.html', graph=svg_url)

@app.route("/ovs_new_instance", methods=["GET","POST"])
def ovs_new_instance():
    if request.method == "POST":
        form_data = request.form
        text = form_data.get('text')
        place = "SAME" #Aca va a ser siempre SAME
        # file_name = form_data.get('file-name') #Poner aca nombre del archivo del grafo
        file_name = nombre_grafo
        svg_url = url_for('static', filename='archivo.svg')
        
        exception = generate_ovs_graph(text, place, file_name)
        
        if exception:
            rdf_text = search_file(file_name)
            files = get_files_in_directory("results")
            return render_template('edit.html', rdf_text=rdf_text, error=exception, files=files)
        else:
            return render_template('graph.html', graph=svg_url)
        
    return render_template('ovs_new_instance.html', nombre_grafo=nombre_grafo)

@app.route("/questions", methods=["GET", "POST"])
def questions():
    if request.method == "POST":
        # Handle the form submission
        pass
    
    p1 = PreguntaOVS(
        id="001",
        pregunta="¿Cuál es el precio del local?",
        query="SELECT ?precio WHERE { ... }",
        respuesta="El precio del local es de $1000.",
        grafo="io:listing_site2_A1405300735 ..."
    )

    p2 = PreguntaOVS(
        id="002",
        pregunta="¿Dónde está ubicado el local?",
        query="SELECT ?direccion WHERE { ... }",
        respuesta="El local está ubicado en la calle Falsa 123.",
        grafo="io:feature_address_real_estate_site2_A1405300735 ..."
    )
        
    p3 = PreguntaOVS(
        id="003",
        pregunta="¿Cuáles son las características del local?",
        query="SELECT ?caracteristicas WHERE { ... }",
        respuesta="El local tiene 3 habitaciones y 2 baños.",
        grafo="io:feature_caracteristicas_real_estate_site2_A1405300735 ..."
    )

    preguntas: List[PreguntaOVS] = [p1, p2, p3]
    return render_template('questions.html', preguntas=preguntas)


#poetry run flask --app index run
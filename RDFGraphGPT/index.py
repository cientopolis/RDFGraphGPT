from flask import Flask, request, render_template, url_for
from RDFGraphGPT import generate_graph, generate_graph_having_rdf, search_file, get_files_in_directory, generate_ovs_graph
from RDFGraphGPT import graph_from_file as gff
import os

app = Flask(__name__)
app.config["DEBUG"] = True

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
            return render_template('edit.html', rdf_text=rdf_text, error=exception)
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
        return render_template('edit.html', rdf_text=rdf_text, error=exception)
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
            return render_template('edit.html', rdf_text=rdf_text, error=exception)
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
            return render_template('edit.html', rdf_text=rdf_text, error=exception)
        else:
            return render_template('from_file.html', files=files,graph=svg_url)
        
    return render_template('from_file.html', files=files)

@app.route("/ovs_new_instance", methods=["GET","POST"])
def ovs_new_instance():
    if request.method == "POST":
        # Obtiene los datos del formulario
        form_data = request.form
        text = form_data.get('text')
        place = "DIFFERENT"
        file_name = form_data.get('file-name')
        svg_url = url_for('static', filename='archivo.svg')
        
        exception = generate_ovs_graph(text, place, file_name)
        
        if exception:
            rdf_text = search_file(file_name)
            return render_template('edit.html', rdf_text=rdf_text, error=exception)
        else:
            return render_template('graph.html', graph=svg_url)
        
    return render_template('ovs_new_instance.html')

# if __name__ == "__main__":
#     app.run()

#poetry run flask --app index run
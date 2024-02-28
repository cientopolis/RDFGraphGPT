import './App.css';
// import Graph from "react-graph-vis";
import React, { useState } from "react";

import * as d3 from 'd3';
import 'd3-graphviz';

import cytoscape from 'cytoscape';

var arch;

// modelo viejo, deprecado -> "text-davinci-003"

const DEFAULT_PARAMS = {
  "model": "gpt-3.5-turbo-instruct",
  "temperature": 0.3,
  "max_tokens": 800,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0
}

const SELECTED_PROMPT = "RDF"

let archNames=[];


//----------------------------------------------------------------------------------------------------------
//Funciones para guardar en archivos

//guarda el rdf en el file system
async function guardarRDF(respuesta, archName){

  let data = {
    id: archName,
    respuesta: respuesta
  };

  let dataAEnviar = JSON.stringify(data);
  const serverUrl = 'http://localhost:5000/guardarRDF'; // Cambia la URL según la ubicación de tu servidor Node.js

  const options = {// Opciones para la solicitud POST
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: dataAEnviar, 
  };

  // Realiza la solicitud POST al servidor Node.js
  fetch(serverUrl, options)
    .then(response => response.json()) // Maneja la respuesta del servidor
    .then(result => {
      console.log(result); // Haz algo con la respuesta del servidor, si es necesario
    })
    .catch(error => {
      console.error('Error:', error); // Maneja errores de la solicitud
  });

  return await readRDF(archName);
}

//edita el rdf sobreescribiendo su contenido con uno nuevo
async function editRDF(archName, rdf){
  // const rdfEditado = document.getElementsByClassName("rdfText")[0].value;
  console.log("Esto es lo que se va a guardar: ",rdf);

  let data = {
    id: archName,
    respuesta: rdf
  };

  let dataAEnviar = JSON.stringify(data);
  const serverUrl = 'http://localhost:5000/editarRDF';

  const options = {// Opciones para la solicitud POST
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: dataAEnviar, 
  };

  // Realiza la solicitud POST al servidor Node.js
  fetch(serverUrl, options)
    .then(response => response.json()) // Maneja la respuesta del servidor
    .then(result => {
      console.log(result); // Haz algo con la respuesta del servidor, si es necesario
    })
    .catch(error => {
      console.error('Error:', error); // Maneja errores de la solicitud
  });

  return await readRDF(archName);
}

//lee el contenido del archivo .rdf
async function readRDF(archName){
  const serverUrl = `http://localhost:5000/readRDF?id=${archName}`; // Cambia la URL según la ubicación de tu servidor Node.js
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  return fetch(serverUrl, options)
  .then(response => response.json()) // Maneja la respuesta del servidor
  .then(result => {// Haz algo con la respuesta del servidor, si es necesario
    let entireArch = result.message;
    return entireArch;
  })
}

//hace el fetch al servidor para leer todos los nombres de los archivos
async function readAllArchives(){
  const url = 'http://localhost:5000/archNames'; // Cambia la URL según la ubicación de tu servidor Node.js

  const options = {// Opciones para la solicitud POST
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    } 
  };

  let names = await fetch(url, options)
    .then(response => response.json()) // Maneja la respuesta del servidor
    .then(result => { // Haz algo con la respuesta del servidor, si es necesario
      return result.message;
    })
    .catch(error => {
      console.error('Error:', error); // Maneja errores de la solicitud
  });

  if(names.length === 0){
    archNames = [];
  }
  else{
    archNames = names.filter(arch => arch.endsWith(".rdf"));
  }
  return archNames;
}

//Pone valor a las options del select a partir de leer los nombres de los archivos del file system
async function putNamesInSelect(){
  let names = await readAllArchives();

  const select = document.getElementById("nameArch");

  if (select.options.length > 0){
    select.innerHTML = "";
  }

  if(names.length === 0){
    const optionElement = document.createElement('option');
    optionElement.value = "No archives";
    optionElement.text = "No archives";
    select.add(optionElement);
  }else{
    names.forEach(name => {
      const optionElement = document.createElement('option');
      optionElement.value = name;
      optionElement.text = name;
      select.add(optionElement);
    });
  }
  
}

//Pone valor a las options del select a partir de los nombres en la variable archNames
async function putNamesInSelectFromNames(){

  const select = document.getElementById("nameArch");

  if (select.options.length > 0){
    select.innerHTML = "";
  }

  if(archNames.length === 0){
    const optionElement = document.createElement('option');
    optionElement.value = "No archives";
    optionElement.text = "No archives";
    select.add(optionElement);
  }else{
    archNames.forEach(name => {
      const optionElement = document.createElement('option');
      optionElement.value = name;
      optionElement.text = name;
      select.add(optionElement);
    });
  }
  
}

//chequea que el nombre de archivo no exista
async function existeNombre(nombre){
  let names = await readAllArchives();
  if(names.length === 0){
    return false;
  }
  else{
    return names.includes(nombre);
  }
}

// Función para convertir RDF en DOT
function rdfToDot(rdf) {
  const lines = rdf.split('\n').map(line => line.trim());
  const dotStatements = [];
  let sub;
  for (const line of lines) {
    if (line.startsWith('@prefix')) {
      continue; // Ignorar declaraciones de prefijo
    }
    if (line.trim() === '.') {
      continue; // Ignorar delimitadores de declaración RDF
    }
    //para identificar listas
    const tieneParentesis = /\(([^)]+)\)/;
    if(tieneParentesis.test(line)){
      let lista = line.split("(")[1].split(")")[0];
      let elementos = lista.split(/\s+/);//lista de objetos
      console.log("Estos son los elementos: ",elementos);
      let subAndPred = line.split("(")[0];//sujeto y predicado
      let [subject, predicate] = subAndPred.split(/\s+/);
      if(predicate === null || predicate === undefined || predicate === ""){  
        predicate = subject;
        subject = sub;
      }
      else{
        sub = subject;
      }
      for (const element of elementos) {
        dotStatements.push(`"${subject}" -> "${element}" [label="${predicate}"]`);
      }
      continue;
    }
    //para identificar nombres
    const tieneComillas = /"([^"]+)"/;
    if(tieneComillas.test(line)){
      let lista = line.split('"')[1];
      console.log("Esta es la lista: ",lista);
      let [subject, predicate] = line.split('"')[0].split(/\s+/);
      if(predicate === null || predicate === undefined || predicate === ""){  
        predicate = subject;
        subject = sub;
      }
      else{
        sub = subject;
      }
      dotStatements.push(`"${subject}" -> "${lista}" [label="${predicate}"]`);
      continue;
    }

    // Dividir la línea en sujeto y predicado
    let [subject, predicate, object] = line.split(/\s+/);
    
    if(object === ";" || object === "."){
      object = predicate;
      predicate = subject;
      subject = sub;
    }
    else{
      sub = subject;
    }
    const regex = /\^\^xsd:/;
    if (regex.test(object)) {
      object = object.split("^^xsd:")[0];
    }
    // Ignorar líneas que no tienen un sujeto o predicado válido
    if (subject && predicate && object) {
      dotStatements.push(`"${subject}" -> "${object}" [label="${predicate}"]`);
    }
  }
  let dotFormat = `digraph G {${dotStatements.join(' ')}}`;
  const regex2 = /"{2}/g;
  if(regex2.test(dotFormat)){
    dotFormat = dotFormat.replace(/"{2}/g, '"');
  }
  return dotFormat;
}
// Función para convertir RDF en JSON
function rdfToJSON(rdf) {
  const lines = rdf.split('\n').map(line => line.trim());
  let nodes = [];
  let edges = [];
  let edgesRep = [];
  let sub;

  for (const line of lines) {
    if (line.startsWith('@prefix')) {
      continue; // Ignorar declaraciones de prefijo
    }

    if (line.trim() === '.') {
      continue; // Ignorar delimitadores de declaración RDF
    }
    //para identificar listas
    const tieneParentesis = /\(([^)]+)\)/;
    if(tieneParentesis.test(line)){
      let lista = line.split("(")[1].split(")")[0];
      let elementos = lista.split(/\s+/);//lista de objetos
      let subAndPred = line.split("(")[0];//sujeto y predicado
      let [subject, predicate] = subAndPred.split(/\s+/);
      if(predicate === null || predicate === undefined || predicate === ""){  
        predicate = subject;
        subject = sub;
      }
      else{
        sub = subject;
      }
      for (const element of elementos) {
        guardar(subject, predicate, element);
      }
      continue;
    }
    //para identificar nombres
    const tieneComillas = /"([^"]+)"/;
    if(tieneComillas.test(line)){
      let lista = line.split('"')[1];
      let [subject, predicate] = line.split('"')[0].split(/\s+/);
      if(predicate === null || predicate === undefined || predicate === ""){  
        predicate = subject;
        subject = sub;
      }
      else{
        sub = subject;
      }
      guardar(subject, predicate, lista);
      continue;
    }
    // Dividir la línea en sujeto y predicado
    let [subject, predicate, object] = line.split(/\s+/);
    
    if(object === ";" || object === "."){
      object = predicate;
      predicate = subject;
      subject = sub;
    }
    else{
      sub = subject;
    }
    const regex = /\^\^xsd:/;
    if (regex.test(object)) {
      object = object.split("^^xsd:")[0];
    }
    
    const regex2 = /"{2}/g;
    if(regex2.test([subject, predicate, object])){
      [subject, predicate, object] = [subject, predicate, object].replace(/"{2}/g, '"');
    }

    guardar(subject, predicate, object);
    function guardar(subject, predicate, object){
      // Ignorar líneas que no tienen un sujeto o predicado válido
      if (subject && predicate && object){
        nodes.push({data : {id : `${subject}`}});
        nodes.push({data : {id : `${object}`}});
        if(!edgesRep.some(edge => edge.id === `${predicate}`)){
          edgesRep.push({id : `${predicate}`, cant : 1});
          edges.push({data : {id : `${predicate}`, source : `${subject}`, target : `${object}`, label : `${predicate}`}});
        }
        else{
          let ident = edgesRep.find(edge => edge.id === `${predicate}`).cant;
          let index = edgesRep.findIndex(edge => edge.id === `${predicate}`);
          edgesRep[index] = ({id : `${predicate}`, cant : ident + 1});
          edges.push({data : {id : `${predicate}-${ident}`, source : `${subject}`, target : `${object}`, label : `${predicate}`}});
        }
      }
    }
  }
  return {nodes : nodes, edges : edges};
}
//para ver el codigo rdf y poder editarlo
async function seeTheRdf(){
  let where = document.getElementsByClassName('select').value;
  let name;
  if(where === "DIFFERENT"){
    name = document.getElementsByClassName("archName")[0].value;
  }
  else{
    name = document.getElementById("nameArch").value;
    name = name.split(".")[0];
  }

  const serverUrl = `http://localhost:5000/readRDF?id=${name}`; // Cambia la URL según la ubicación de tu servidor Node.js
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  await fetch(serverUrl, options)
  .then(response => response.json()) // Maneja la respuesta del servidor
  .then(result => {// Haz algo con la respuesta del servidor, si es necesario
    let entireArch = result.message;
    let res = document.getElementById("resultado");
    res.style.display = 'block';
    res.querySelector('.rdfText').value = entireArch;
  });
  const button = document.querySelector('#seeRDF');
  button.style.display = 'none';
}

//busca el nombre del archivo actual
function buscarNombre(){
  let name="";
  let valor = document.getElementsByClassName("select")[0].value;

  if (valor === "DIFFERENT"){
    name = document.getElementsByClassName("archName")[0].value;
  }
  else{
    name = document.getElementById("nameArch").value;
    name = name.split(".")[0];
  }
  return name;
}
//para cerrar el campo de edicion del codigo rdf
function closeResult() {
  const resultadoElement = document.getElementById("resultado");
  resultadoElement.style.display = 'none';
  const button = document.querySelector('#seeRDF');
  button.style.display = 'block';
}
//para editar el codigo del rdf manualmente
function editResult(){
  let nuevoRDF = document.getElementsByClassName("rdfText")[0].value;
  closeResult();
  document.body.style.cursor = 'wait';
  document.getElementsByClassName("generateButton")[0].disabled = true;
  let arch = buscarNombre();
  editRDF(arch, nuevoRDF);
  graphRDF(nuevoRDF);
}
//para limpiar el contenido de la seccion del grafico
function clearGraph(){
  document.getElementById("graph").innerHTML = "";
}
//grafica el rdf dependiendo del graficador seleccionado
function graphRDF(nuevoArch){
  const grafico = document.getElementsByClassName("grafico")[0].value;
  document.getElementById("graph").innerHTML = "";

  if(grafico === "graphviz"){
    //--------------------Muestro grafo con graphviz--------------------
    let dotFormat = rdfToDot(nuevoArch);
    
    d3.select("#graph")
      .graphviz()
      .renderDot(dotFormat);

    //-------------------------------------------------------------------
  }
  else{
    //--------------------Muestro grafo con cytoscape--------------------
    let jsonFormat = rdfToJSON(nuevoArch);

    const cy = cytoscape({
      container: document.getElementById('graph'), // El contenedor donde se renderizará el grafo
      elements: {
        nodes: jsonFormat.nodes,
        edges: jsonFormat.edges
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': 'data(id)'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#FF0000',
            'target-arrow-fill': 'filled',
            'curve-style': 'bezier',
            'label': 'data(label)'
          }
        }
      ],
      layout: {
        name: 'grid'
      }
    });
    
    // Habilita la edición de etiquetas de nodos y aristas
    cy.nodes().on('dblclick', function (event) {
      const node = event.target;
      const newLabel = prompt('Ingrese el nuevo nombre para el nodo:', node.data('id'));
      if (newLabel !== null) {
        node.data('id', newLabel);

        node.style({ 'label' : `${newLabel}` });
      }
    });
    
    cy.edges().on('dblclick', function (event) {
      const edge = event.target;
      const newLabel = prompt('Ingrese el nuevo nombre para la arista:', edge.data('id'));
      if (newLabel !== null) {
        edge.data('id', newLabel);

        edge.style({ 'label' : `${newLabel}` });
      }
    });
    //-------------------------------------------------------------------
  }

  document.getElementsByClassName("searchBar")[0].value = "";
  document.body.style.cursor = 'default';
  document.getElementsByClassName("generateButton")[0].disabled = false;

  let botones = document.getElementsByName('botonOculto');
  botones.forEach(element => {
    element.style.display = 'block';
  });
}

//---funciones para abrir y cerrar modal------------------------------------------------------------------------
  
function mostrarModal() {
  const miModal = document.getElementById("miPrompt");
  miModal.style.display = "block";
}

function cerrarModal() {
  const miModal = document.getElementById("miPrompt");
  miModal.style.display = "none";
}


//--------------------------------------------------------------------------------------------------------------

function App() {

  putNamesInSelect();

  const queryImprovement = (IRI, apiKey) => {
    fetch('prompts/improvement.prompt')
      .then(response => response.text())
      .then(text => text.replace("$IRIS", IRI))
      .then(async(promp) =>{
        let name= buscarNombre();

        let RDF = await guardarRDF("", name);

        promp = promp.replace("$RDF", RDF);

        const params = { ...DEFAULT_PARAMS,model: "gpt-3.5-turbo-instruct", prompt: promp, stop: "eof"};

        const requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + String(apiKey)
          },
          body: JSON.stringify(params)
        };
        fetch('https://api.openai.com/v1/completions', requestOptions)
        .then(response => {
          if (!response.ok) {
            switch (response.status) {
              case 401: // 401: Unauthorized: API key is wrong
                throw new Error('Please double-check your API key.');
              case 429: // 429: Too Many Requests: Need to pay
                throw new Error('You exceeded your current quota, please check your plan and billing details.');
              default:
                throw new Error('Something went wrong with the request, please check the Network log');
            }
          }
          return response.json();
        })
        .then(async(response) => {
          const {choices} = response;
          let text = choices[0].text;

          let nuevoArch = await editRDF(name, text);
          
          document.body.style.cursor = 'default';
          document.getElementsByClassName("generateButton")[0].disabled = false;
          alert("The RDF was improved successfully");
        })
        .catch((error) => {
          console.log(error);
          alert(error);
          });
      });
  };

  const queryRDF = (promp, apiKey) => {
    fetch('prompts/rdf.prompt')
      .then(response => response.text())
      .then(text => text.replace("$prompt", promp))
      .then(promp => {
        console.log("Esta es la prompt que escribi: ",promp)

        const params = { ...DEFAULT_PARAMS,prompt: promp, stop: "eof"};

        const requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + String(apiKey)
          },
          body: JSON.stringify(params)
        };
        fetch('https://api.openai.com/v1/completions', requestOptions)
          .then(response => {
            if (!response.ok) {
              switch (response.status) {
                case 401: // 401: Unauthorized: API key is wrong
                  throw new Error('Please double-check your API key.');
                case 429: // 429: Too Many Requests: Need to pay
                  throw new Error('You exceeded your current quota, please check your plan and billing details.');
                default:
                  throw new Error('Something went wrong with the request, please check the Network log');
              }
            }
            return response.json();
          })
          .then(async(response) => {
            const { choices } = response;
            let text = choices[0].text;

            let valor = document.getElementsByClassName("select")[0].value;
            let name = "";

            if (valor === "DIFFERENT"){
              name = document.getElementsByClassName("archName")[0].value;
              if(name === ""){
                alert("Please enter a name for the archive");
                document.body.style.cursor = 'default';
                document.getElementsByClassName("generateButton")[0].disabled = false;
                return;
              }
              else if(await existeNombre(name+".rdf")){
                alert("That archive name already exists, please enter another one");
                document.body.style.cursor = 'default';
                document.getElementsByClassName("generateButton")[0].disabled = false;
                return;
              }
              archNames.push(name+".rdf");
              await putNamesInSelectFromNames();
            }
            else{
              name = document.getElementById("nameArch").value;
              name = name.split(".")[0];
            }

            let nuevoArch = await guardarRDF(text, name);
            console.log("Este es el nuevo archivo: ",nuevoArch);

            graphRDF(nuevoArch);

          }).catch((error) => {
            console.log(error);
            alert(error);
          });
      })
  };

  const emptyPrompt = async () => {
    let name;
    name = document.getElementById("nameArch").value;
    name = name.split(".")[0];

    if(!existeNombre(name + ".rdf")){
      alert("You have to select an existent archive in order to graph it");    
    }
    else{
      let rdf = await readRDF(name);
      console.log("Este es el rdf: ",rdf);
      graphRDF(rdf);
    }
  }

  const queryPrompt = (prompt, apiKey, option) => {
    if(option === "normal"){
      queryRDF(prompt, apiKey);
    }
    else{
      queryImprovement(prompt, apiKey);
    }
  }


  const createGraph = () => {
    document.body.style.cursor = 'wait';

    document.getElementsByClassName("generateButton")[0].disabled = true;
    const prompt = document.getElementsByClassName("searchBar")[0].value;
    const apiKey = document.getElementsByClassName("apiKeyTextField")[0].value;
    if(prompt === ""){
      console.log("No hay prompt");
      emptyPrompt();
    }
    else{
      queryPrompt(prompt, apiKey, "normal");
    }
  }

  const improveRDF = () => {
    //const nuevosIRIS = prompt("Ingrese los nuevos IRIs separados por coma");
    let nuevosIRIS = document.getElementById("viejosIRIS").value;
    nuevosIRIS = nuevosIRIS + document.getElementById("nuevosIRIS").value;
    console.log("Estos son los nuevos IRIS: ",nuevosIRIS);
    cerrarModal();
    document.body.style.cursor = 'wait';
    document.getElementsByClassName("generateButton")[0].disabled = true;

    const apiKey = document.getElementsByClassName("apiKeyTextField")[0].value;
    queryPrompt(nuevosIRIS, apiKey, "improve");
  }

  return (
    <div className='container'>
      <h1 className="headerText">RDFGraphGPT 🕸️</h1>
      <p className='subheaderText'>Parse natural language into rdf triples and build complex, directed graphs from that. Understand the relationships between people, systems, and maybe solve a mystery.</p>
      <p className='opensourceText'><a href="https://github.com/varunshenoy/graphgpt">GraphGPT is open-source</a>&nbsp;🎉</p>
      <p className="subheaderText">Where do you want to save your rdf?</p>
      <br></br>
      <div  className="select-container" >
        <div>
          <select  className="select">
            <option value="DIFFERENT">New archive</option>
            <option value="SAME">Existent archive</option>
          </select>
        </div>
        
        <div className="nameContainer">
          <input className="archName" placeholder="Enter the name of the archive..."></input>
        </div>
      </div>
      <br/>
      
      
      <center> 
        <div className="segundoSelect">
          <select id="nameArch" className="selectdos">
          </select>
        </div> 
        <br></br>
        <div className="segundoSelect">
          <select id="grafico" className="grafico">
            <option value="graphviz">Graphviz</option>
            <option value="cytoscape">Cytoscape</option>
          </select>
        </div> 

        <div className='inputContainer'>
          <input className="searchBar" placeholder="Describe your graph..."></input>
          <input className="apiKeyTextField" type="password" placeholder="Enter your OpenAI API key..."></input>
          <div className="buttonsContainer">
            <button className="generateButton" onClick={createGraph}>Generate</button>
            <button className="clearButton" onClick={clearGraph}>Clear</button>
          </div>
        </div>
      </center>

      <div className='graphContainer'>
        <div id="graph"></div>
      </div>

      <br></br>
      <div id="containerSeeRDF">
        <button className='generateButton' id='improveRDF' name="botonOculto" onClick={mostrarModal}>Improve RDF</button>
      </div>
      <br></br>

      <div id="resultado" className="resultado">
        <h1>Edita tu RDF</h1>
          <textarea className="rdfText" rows="10" cols="30"></textarea>
          <br></br>
          <div>
              <button className="closeRDF" onClick={editResult} >Editar</button>
              <button className="closeRDF" onClick={closeResult} >Cerrar</button>
          </div>
      </div>

      <button className='generateButton' id='seeRDF' name="botonOculto" onClick={seeTheRdf}>Edit the rdf code</button>
      <p className='footer'>Pro tip: don't take a screenshot! You can right-click and save the graph as a .png  📸</p>

      <div id="miPrompt" className="mi-prompt">
        <label>Ingrese los IRIs que quiere modificar:</label>
        <textarea id="viejosIRIS" rows="4" cols="50"></textarea>
        <label>Ingrese los nuevos IRIs:</label>
        <textarea id="nuevosIRIS" rows="4" cols="50"></textarea>
        <div id="botonesImprove">
          <button onClick={improveRDF} >Aceptar</button>
          <button id="segundoboton" onClick={cerrarModal}>Cerrar</button>
        </div>
      </div>

      

    </div>
  );
}

export default App;

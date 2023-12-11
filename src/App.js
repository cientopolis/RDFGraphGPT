import './App.css';
// import Graph from "react-graph-vis";
import React, { useState } from "react";

import * as d3 from 'd3';
import 'd3-graphviz';

import cytoscape from 'cytoscape';

var arch;

const DEFAULT_PARAMS = {
  "model": "text-davinci-003",
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

  //El codigo que sigue es para leer el contenido completo del archivo (para graficar todo si es que el archivo ya estaba escrito)

  const serverUrl2 = `http://localhost:5000/readRDF?id=${archName}`; // Cambia la URL según la ubicación de tu servidor Node.js
  const options2 = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  return fetch(serverUrl2, options2)
  .then(response => response.json()) // Maneja la respuesta del servidor
  .then(result => {// Haz algo con la respuesta del servidor, si es necesario
    let entireArch = result.message;
    return entireArch;
  })
}

//edita el rdf sobreescribiendo su contenido con uno nuevo
async function editRDF(archName){
  const rdfEditado = document.getElementsByClassName("rdfText")[0].value;
  console.log("Esto es lo que se va a guardar: ",rdfEditado);

  let data = {
    id: archName,
    respuesta: rdfEditado
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

function rdfToJSON(rdf) {
  const lines = rdf.split('\n').map(line => line.trim());
  let nodes = [];
  let edges = [];
  let sub;

  for (const line of lines) {
    if (line.startsWith('@prefix')) {
      continue; // Ignorar declaraciones de prefijo
    }

    if (line.trim() === '.') {
      continue; // Ignorar delimitadores de declaración RDF
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
    if (subject && predicate && object){
      nodes.push({data : {id : `${subject}`}});
      nodes.push({data : {id : `${object}`}});
      edges.push({data : {id : `${predicate}`, source : `${subject}`, target : `${object}`}});
    }
  }

  return {nodes : nodes, edges : edges};
}

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
    document.getElementById('resultado').innerHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Editar RDF</title>
      </head>
      <body>
          <h1>Edita tu RDF</h1>
          <form>
              <textarea style="width:100%" class="rdfText" rows="10" cols="30">${entireArch}</textarea>
              <br>
              <div style="float:right;width: 50%" >
                <button class="clearButton" type="submit" style="float:right;">Guardar</button>
              </div>
          </form>
      </body>
      </html>
  `;
  });
  const button = document.querySelector('#seeRDF');
  button.style.display = 'none';
}

//----------------------------------------------------------------------------------------------------------
//no usadas
function guardarInfo(respuesta, state, id){
  console.log('estado: ',state);

  let rta = JSON.parse(respuesta);
  let parseado = '';
  
  /*
  Guarda en parseado todas las relaciones.
  Si hay una relacion ida y vuelta entre dos entidades o dos relaciones entre dos entidades, estas a[areceran dos veces.]
  */
  rta.forEach(element => {
    element.forEach(e => parseado+= e + '->');
    parseado+='\n'
  });
  /*
  En caso de que no este creado aun el archivo, le pone el nombre graph seguido de 
  el id del json para que no haya 2 archivos iguales (puede fallar)
  */
  if(state === 'stateless'){
    arch = `graph-${id}`;
  }

  let nombre = `${arch}`;

  //guardarArchivoDeTexto(parseado,nombre);
  guardarEnRDF(rta,id);

  console.log('parseado: ',parseado);
}

function guardarEnRDF(rta,id){

  rta.forEach(function(res){
    let data;
    if(res.length === 3){

      data = {
        id: id,
        entity1: res[0],
        relation: res[1],
        entity2: res[2]
      }
      let dataAEnviar = JSON.stringify(data);

      //si es una response de tipo entuty->relation->entity, lo guardo en RDF
      const serverUrl = 'http://localhost:5000/guardarRDF'; // Cambia la URL según la ubicación de tu servidor Node.js

      // Opciones para la solicitud POST
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: dataAEnviar, // Convierte los datos a JSON y los envía en el cuerpo de la solicitud
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
    }
  });
}

//---------------------------------------------------------------------------------------------------------

function App() {

  putNamesInSelect();

  const [graphState, setGraphState] = useState(
    {
      nodes: [],
      edges: []
    }
  );

  const clearState = () => {
    setGraphState({
      nodes: [],
      edges: []
    })
  };

  var current_graph = JSON.parse(JSON.stringify(graphState));

  const updateGraph = (updates) => {
    // updates will be provided as a list of lists
    // each list will be of the form [ENTITY1, RELATION, ENTITY2] or [ENTITY1, COLOR]

    

    if (updates.length === 0) {
      return;
    }

    // check type of first element in updates
    if (typeof updates[0] === "string") {
      // updates is a list of strings
      updates = [updates]
    }

    updates.forEach(update => {
      if (update.length === 3) {
        // update the current graph with a new relation
        const [entity1, relation, entity2] = update;

        // check if the nodes already exist
        var node1 = current_graph.nodes.find(node => node.id === entity1);
        var node2 = current_graph.nodes.find(node => node.id === entity2);

        if (node1 === undefined) {
          current_graph.nodes.push({ id: entity1, label: entity1, color: "#ffffff" });
        }

        if (node2 === undefined) {
          current_graph.nodes.push({ id: entity2, label: entity2, color: "#ffffff" });
        }

        // check if an edge between the two nodes already exists and if so, update the label
        //Esto es lo que hace que solo pueda haber 1 relacion entre dos nodos
        //Lo transfome para que si hay una relacion existente entre los dos nodos, se agregue esta con curvatura
        var edges = current_graph.edges.filter(edge => edge.from === entity1 && edge.to === entity2);
        //var edge = current_graph.edges.find(edge => edge.from === entity1 && edge.to === entity2);
        if (edges.length > 0) {
          switch(edges.length){
            case 1:
              console.log("entro al case 1");
              current_graph.edges.push({ from: entity1, to: entity2, label: relation, smooth:{type: 'curvedCW',roundness: 0.7}});
              break;
            case 2:
              console.log("entro al case 2");
              current_graph.edges.push({ from: entity1, to: entity2, label: relation, smooth:{type: 'curvedCCW',roundness: 0.7}});
              break;
            default:
              console.log("entro al default");
              current_graph.edges.push({ from: entity1, to: entity2, label: relation});
              break;
          }

          return;
        }

        current_graph.edges.push({ from: entity1, to: entity2, label: relation});

      } else if (update.length === 2 && update[1].startsWith("#")) {
        // update the current graph with a new color
        const [entity, color] = update;

        // check if the node already exists
        var node = current_graph.nodes.find(node => node.id === entity);

        if (node === undefined) {
          current_graph.nodes.push({ id: entity, label: entity, color: color });
          return;
        }

        // update the color of the node
        node.color = color;

      } else if (update.length === 2 && update[0] === "DELETE") {
        // delete the node at the given index
        const [_, index] = update;

        // check if the node already exists
        var node = current_graph.nodes.find(node => node.id === index);

        if (node === undefined) {
          return;
        }

        // delete the node
        current_graph.nodes = current_graph.nodes.filter(node => node.id !== index);

        // delete all edges that contain the node
        current_graph.edges = current_graph.edges.filter(edge => edge.from !== index && edge.to !== index);
      }
    });
    setGraphState(current_graph);
  };

  const queryStatelessPrompt = (prompt, apiKey) => {
    fetch('prompts/stateless.prompt')
      .then(response => response.text())
      .then(text => text.replace("$prompt", prompt))
      .then(prompt => {
        console.log("Esta es la prompt que escribi: ",prompt)

        const params = { ...DEFAULT_PARAMS, prompt: prompt, stop: "\n" };

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
          .then((response) => {
            console.log("response: ",response);
            const { choices } = response;
            const text = choices[0].text;
            console.log("Esto es lo primero que devuelve la api: ",text);

            if(current_graph.nodes.length === 0){
              guardarInfo(text,'stateless', response.id);
            }
            else{
              guardarInfo(text,'stateful',0);
            }

            const updates = JSON.parse(text);
            console.log("Aca la respuesta ya esta parseada: ",updates);

            updateGraph(updates);//este llama a updateGraph mientras que el otro llama a setGraphState

            document.getElementsByClassName("searchBar")[0].value = "";
            document.body.style.cursor = 'default';
            document.getElementsByClassName("generateButton")[0].disabled = false;
          }).catch((error) => {
            console.log(error);
            alert(error);
          });
      })
  };

  const queryStatefulPrompt = (prompt, apiKey) => {
    fetch('prompts/stateful.prompt')
      .then(response => response.text())
      .then(text => text.replace("$prompt", prompt))
      .then(text => text.replace("$state", JSON.stringify(graphState)))
      .then(prompt => {
        console.log("Esta es la prompt que escribi: ",prompt)

        const params = { ...DEFAULT_PARAMS, prompt: prompt };

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
          .then((response) => {
            const { choices } = response;
            const text = choices[0].text;
            console.log("Esto es lo primero que devuelve la api: ",text);

            guardarInfo(text,'stateful');

            const new_graph = JSON.parse(text);

            console.log("Aca la respuesta ya esta parseada: ", new_graph);

            setGraphState(new_graph);//este llama a setGraphState mientras que el otro llama a updateGraph

            document.getElementsByClassName("searchBar")[0].value = "";
            document.body.style.cursor = 'default';
            document.getElementsByClassName("generateButton")[0].disabled = false;
          }).catch((error) => {
            console.log(error);
            alert(error);
          });
      })
  };

  const queryRDF = (promp, apiKey) => {
    fetch('prompts/rdf.prompt')
      .then(response => response.text())
      .then(text => text.replace("$prompt", promp))
      .then(promp => {
        console.log("Esta es la prompt que escribi: ",promp)

        const params = { ...DEFAULT_PARAMS, prompt: promp, stop: "eof"};

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

            const grafico = document.getElementsByClassName("grafico")[0].value;
            console.log("grafico: ",grafico);

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
                      'target-arrow-color': '#ccc',
                      'target-arrow-shape': 'triangle',
                      'label': 'data(id)'
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
          }).catch((error) => {
            console.log(error);
            alert(error);
          });
      })
  };

  const queryPrompt = (prompt, apiKey) => {
    // if (SELECTED_PROMPT === "STATELESS") {
    //   queryStatelessPrompt(prompt, apiKey);
    // } else if (SELECTED_PROMPT === "STATEFUL") {
    //   queryStatefulPrompt(prompt, apiKey);
    // } else if(SELECTED_PROMPT === "RDF"){
    queryRDF(prompt, apiKey);
    // }else {
    //   alert("Please select a prompt");
    //   document.body.style.cursor = 'default';
    //   document.getElementsByClassName("generateButton")[0].disabled = false;
    // }
  }


  const createGraph = () => {
    document.body.style.cursor = 'wait';

    document.getElementsByClassName("generateButton")[0].disabled = true;
    const prompt = document.getElementsByClassName("searchBar")[0].value;
    const apiKey = document.getElementsByClassName("apiKeyTextField")[0].value;
    queryPrompt(prompt, apiKey);
  }

  return (
    <div className='container'>
      <h1 className="headerText">RDFGraphGPT 🔎</h1>
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
          <button className="generateButton" onClick={createGraph}>Generate</button>
          <button className="clearButton" onClick={clearState}>Clear</button>
        </div>
      </center>

      <div className='graphContainer'>
        <div id="graph"></div>
      </div>

      <div id="resultado"></div>
      <br></br>
      <div id="containerSeeRDF">
        <button className='generateButton' id='seeRDF' onClick={seeTheRdf}>See the rdf code</button>
      </div>
      <p className='footer'>Pro tip: don't take a screenshot! You can right-click and save the graph as a .png  📸</p>
    </div>
  );
}

export default App;

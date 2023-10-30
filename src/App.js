import './App.css';
import Graph from "react-graph-vis";
import React, { useState } from "react";

import * as d3 from 'd3';
import 'd3-graphviz';


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

var options = {
  layout: {
    hierarchical: true
  },
  edges: {
    color: "#34495e",
    smooth: {
      enabled: true,
    }
  }
};

//----------------------------------------------------------------------------------------------------------
//Funciones para guardar en archivos

function guardarRDF(respuesta, id){
  console.log('respuesta: ',respuesta);
  console.log('id: ',id);

  let data = {
    id: id,
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

  // const serverUrl2 = 'http://localhost:5000/graphToDot'; // Cambia la URL según la ubicación de tu servidor Node.js
  // const options2 = {
  //   method: 'GET',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   }
  // };

  // fetch(serverUrl2, options2)
  // .then(response => response.json()) // Maneja la respuesta del servidor
  // .then(result => {
  //   console.log(result); // Haz algo con la respuesta del servidor, si es necesario
  //   let dotFormat = result.message;
  //   console.log("asi queda luego de la funcion: ",dotFormat);
  //   d3.select("#graph")
  //     .graphviz()
  //     .renderDot(dotFormat);
  // })
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

  const queryRDF = (prompt, apiKey) => {
    fetch('prompts/rdf.prompt')
      .then(response => response.text())
      .then(text => text.replace("$prompt", prompt))
      .then(prompt => {
        console.log("Esta es la prompt que escribi: ",prompt)

        const params = { ...DEFAULT_PARAMS, prompt: prompt, stop: "end"};

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
            let text = choices[0].text;

            guardarRDF(text,response.id);

            let dotFormat = rdfToDot(text);
            console.log("asi queda luego de la funcion: ",dotFormat);
            d3.select("#graph")
              .graphviz()
              .renderDot(dotFormat);

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
    if (SELECTED_PROMPT === "STATELESS") {
      queryStatelessPrompt(prompt, apiKey);
    } else if (SELECTED_PROMPT === "STATEFUL") {
      queryStatefulPrompt(prompt, apiKey);
    } else if(SELECTED_PROMPT === "RDF"){
      queryRDF(prompt, apiKey);
    }else {
      alert("Please select a prompt");
      document.body.style.cursor = 'default';
      document.getElementsByClassName("generateButton")[0].disabled = false;
    }
  }


  const createGraph = () => {
    document.body.style.cursor = 'wait';

    document.getElementsByClassName("generateButton")[0].disabled = true;
    const prompt = document.getElementsByClassName("searchBar")[0].value;
    const apiKey = document.getElementsByClassName("apiKeyTextField")[0].value;

    queryPrompt(prompt, apiKey);
  }
  //<Graph graph={graphState} options={options} style={{ height: "640px" }} />
  return (
    <div className='container'>
      <h1 className="headerText">GraphGPT 🔎</h1>
      <p className='subheaderText'>Parse natural language into rdf triples and build complex, directed graphs from that. Understand the relationships between people, systems, and maybe solve a mystery.</p>
      <p className='opensourceText'><a href="https://github.com/varunshenoy/graphgpt">GraphGPT is open-source</a>&nbsp;🎉</p>
      <center>
        <div className='inputContainer'>
          <input className="searchBar" placeholder="Describe your graph..."></input>
          <input className="apiKeyTextField" type="password" placeholder="Enter your OpenAI API key..."></input>
          <button className="generateButton" onClick={createGraph}>Generate</button>
          <button className="clearButton" onClick={clearState}>Clear</button>
        </div>
      </center>
      <div className='graphContainer'>
        <div id="graph" ></div>
      </div>
      <p className='footer'>Pro tip: don't take a screenshot! You can right-click and save the graph as a .png  📸</p>
    </div>
  );
}

export default App;

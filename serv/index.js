const express = require('express');
const $rdf = require("rdflib");
const fs = require("fs");
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());
const port = 5000; // Puedes elegir el puerto que desees

let grafo;

app.get('/', (req, res) => {
    res.status(200).json({ message: '¡Hola Mundo!' });
  });

app.get('/graphToDot', async(req, res) => {
    try{
        let dotString = graphToDot();
        res.status(200).json({ message: dotString });
    }catch (error) {
        // En caso de error, maneja el error y responde con un mensaje de error
        console.error('Error al convertir a DOT:', error);
        res.status(500).json({ message: 'Error al convertir a DOT' });
    }
});

app.post('/guardarRDF', async(req, res) => {
    //const { id, entity1, relation, entity2 } = req.body;
    const { id, respuesta }= req.body;
    try{
        //.replace(/\s+/g, ''); => para sacarle los espacios a los strings
        //await guardarRDF(id,entity1.replace(/\s+/g, ''),relation.replace(/\s+/g, ''),entity2.replace(/\s+/g, ''));
        await guardarRDF(id,respuesta);

        res.status(200).json({ message: '¡Guardado!' });
    }catch (error) {
        // En caso de error, maneja el error y responde con un mensaje de error
        console.error('Error al guardar RDF:', error);
        res.status(500).json({ message: 'Error al guardar RDF' });
    }
});


app.listen(port, () => {
  console.log(`Servidor Node.js escuchando en el puerto ${port}`);
});

function guardarRDF(id,graph){
    grafo = graph;
    const store = $rdf.graph();

    // Guarda los datos en un archivo llamado "data-{id de la consulta}.rdf"
    let archivo = "data-" + id + ".rdf";

    fs.writeFile(archivo, graph, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Los datos se guardaron correctamente");
        }
    });    
}

function graphToDot(){
    const store = $rdf.graph();
    // store.namespace("xsd", "http://www.w3.org/2001/XMLSchema");
    // $rdf.parse(grafo);
    const dotString = $rdf.serialize(undefined, grafo, "application/rdf+dot");
    console.log(dotString);
    return dotString;
}

// function guardarRDF(id,entity1,relation,entity2){
//     const store = $rdf.graph();

//     // Crea las entidades y la relacion
//     const entity1RDF = $rdf.sym(`http://example.com/resource/${entity1}`);
//     const entity2RDF = $rdf.sym(`http://example.com/resource/${entity2}`);
//     const relationRDF = $rdf.sym(`http://example.com/ontology/${relation}`);

//     // Añade las triples al modelo RDF
//     store.add(entity1RDF, relationRDF, entity2RDF);

//     // Guarda los datos en un archivo
//     const rdfString = $rdf.serialize(undefined, store, entity1RDF.uri, 'text/turtle');
//     //const serialazedData = serializer.serialize(graph);

//     // Guarda los datos en un archivo llamado "data-{id de la consulta}.rdf"
//     let archivo = "data-" + id + ".rdf";

//     fs.writeFile(archivo, rdfString, (err) => {
//         if (err) {
//             console.error(err);
//         } else {
//             console.log("Los datos se guardaron correctamente");
//         }
//     });
    
// }
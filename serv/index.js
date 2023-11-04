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

app.get('/readRDF', async(req, res) => {
    const id = req.query.id;
    const filename = `${id}.rdf`;
    fs.readFile(filename, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            console.log("Los datos se leyeron correctamente");
            res.status(200).json({ message: data.toString('utf8') });
        }
      });
});

app.post('/guardarRDF', async(req, res) => {
    //const { id, entity1, relation, entity2 } = req.body;
    const { id, respuesta }= req.body;
    try{
        await guardarRDF(id,respuesta);

        res.status(200).json({ message: '¡Guardado!' });
    }catch (error) {
        // En caso de error, maneja el error y responde con un mensaje de error
        console.error('Error al guardar RDF:', error);
        res.status(500).json({ message: 'Error al guardar RDF' });
    }
});

app.get('/archNames', async(req, res) => {
    const folderPath = '/home/juana/Documentos/lifia/graphGPT/repoGPT/serv'; // Reemplaza con la ruta de tu carpeta

    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Error al leer la carpeta:', err);
        }
        console.log("Los nombres de los archivos se leyeron correctamente")
        res.status(200).json({ message: files });
    });
});


app.listen(port, () => {
  console.log(`Servidor Node.js escuchando en el puerto ${port}`);
});

function guardarRDF(id,graph){
    grafo = graph;
    // Guarda los datos en un archivo llamado "data-{id de la consulta}.rdf"
    let archivo = id + ".rdf";

    fs.appendFile(archivo, graph, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Los datos se guardaron correctamente");
        }
    });    
}
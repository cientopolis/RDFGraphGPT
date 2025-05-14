# RDFGraphGPT :spider_web:
_This project extends the [Graph GPT project](https://github.com/varunshenoy/GraphGPT) with different approaches in the type of output and the interaction with the originated graph._
# Natural Language -> RDF -> Graph
## Main functionality
* The way this project works is that you insert any kind of natural language text, in the background we send it to Open AI API with an specific prompt so it turns it to an RDF turtle format, and then it will be graphed using either Graphviz or Cytoscape, you can choose!
* The RDF archive will be saved in the location you choose, either in a new one or an existent one.
## Other Functionalities
* You can improve the IRIs that chat GPT used by clicking the "Improve RDF" button and inserting the IRIs you want to change and the ones you would want to use. To do this we use another propmt to send it to the API.
* You can edit the RDF code by hand and save it in your archive by clicking the "Edit the rdf code" button.
## SetUp
1. _Run npm install to download required dependencies._
2. _Do the same standing in the "serv" folder._
3. _Make sure you have an [OpenAI API key](https://platform.openai.com/account/api-keys). You will enter this into the web app when running queries._
4. _Run node index.js standing in the "serv" folder, your server should be runing now._
5. _Run npm run start. RDFGraphGPT should open up in a new browser tab._

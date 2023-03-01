'use strict';

const functions = require('firebase-functions');
const {WebhookClient, Image, Payload} = require('dialogflow-fulfillment');
const admin = require('firebase-admin');
const WolframAlphaAPI = require('wolfram-alpha-api');
admin.initializeApp();
const db = admin.firestore();

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });

    function addHomeworkHandler(agent) {

        let subject = agent.parameters.subject;
        // problem: how to shorten?? like 'chemistry' to 'chem'

        let work = agent.parameters.work || '';
        let date = (new Date(agent.parameters.date)).toDateString();
        let unixtime = parseInt((new Date(agent.parameters.date).getTime() / 1000).toFixed(0));
        console.log('duck this shi~~');
        return db.collection(`homework`).add({ 
            work: work,
            date: unixtime,
            subject: agent.parameters.subjectoriginal
        }).then(ref => {
            console.log('id:'+ref.id);
            if (work == '') {
                agent.add(`Okay, added ${subject} -- ${date} to homework list`);
            } else {
                agent.add(`Okay, added ${subject} ${work} -- ${date} to homework list`);
            }
        }).catch((err)=>{
            console.log(err);
            agent.add(`Could you try that again please! ${err}`);
        });



    }

    function getHomeworkHandler(agent){

        let subjRef = db.collection('homework');
        let query = subjRef.where('date', '>=', parseInt(Math.floor(new Date() / 1000))).get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('No matching documents.');
                agent.add(`No homework!\n`);
                return;
            }  
            snapshot.forEach(doc => {
                let work = doc.get('work') || 'work';
                let subject = doc.get('subject') || '';
                // let options = options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                let datestring = new Date( parseInt( ( doc.get('date') ) *1000 ) ).toDateString();
                console.log(doc.id, '=>', doc.data());
                agent.add(`${subject} ${work} -- ${datestring}\n`);
            });
        })
        .catch(err => {
            console.log('Error getting list', err);
            agent.add(`Could you try that again please!\n`);
        });

        return query;

    }

    function wolframHandler(agent){
        const waApi = WolframAlphaAPI('xxxxxx');
        return waApi.getShort(`${agent.parameters.question}`).then((queryresult, err) => {
            //            const output = pods.map((pod) => {
            //                const subpodContent = pod.subpods.map(subpod =>
            //                                                      agent.add(
            //                    subpod.plaintext
            //                )
            //                                                     );
            //            });
            if(err){
                // agent.add("I am schoolbot! How can I help?");
                return
            }
            //agent.add(queryresult);
            
            
            let payload = {
                "telegram": {
                    "text": queryresult,
                    "reply_markup": {
                        "inline_keyboard": [
                            [
                                {
                                    "text": "Ask another question",
                                    "callback_data": "i hv a qn"

                                }
                            ],
                            [
                                {
                                    "text": "I'm done",
                                    "callback_data": "hi"
                                }
                            ]
                        ]
                    }
                }

            };
            agent.add(new Payload(agent.TELEGRAM, payload, { sendAsMessage: true, rawPayload: true }));
            
            //console.log(output);
        }).catch(err => {
            console.log('Error wolfram resp', err);
            //agent.add(`Could you try that again please!\n`);
            let payload = {
                "telegram": {
                    "text": "I did not quite get that.",
                    "reply_markup": {
                        "inline_keyboard": [
                            [
                                {
                                    "text": "Ask a different question",
                                    "callback_data": "i hv a qn"

                                }
                            ],
                            [
                                {
                                    "text": "Cancel",
                                    "callback_data": "Cancel"
                                }
                            ]
                        ]
                    }
                }

            };
            agent.add(new Payload(agent.TELEGRAM, payload, { sendAsMessage: true, rawPayload: true }));

        });
    }

    function welcomeHandler(agent){
        let quotes = ['Hi! How are you doing? I am SchoolBot, your friendly assistant! \nYou can use me to ask questions and track homework.'
                     , 'Hello! \nYou can use me to ask questions and track homework.',
                     'Greetings! \nYou can use me to ask questions and track homework.'];
        let RandomNumber = Math.floor(Math.random()*quotes.length);
        let text = quotes[RandomNumber];
        let payload = 
            {
                "telegram": {
                    "text": text,
                    "reply_markup": {
                        "inline_keyboard": [
                            [
                                {
                                    "text": "Add Homework",
                                    "callback_data": "add homework"
                                }
                            ],
                            [
                                {
                                    "text": "View Homework",
                                    "callback_data": "view homework"
                                }
                            ],
                            [
                                {
                                    "text": "Ask me anything",
                                    "callback_data": "ask me a question"
                                }
                            ],
                            [
                                {
                                    "text": "Tell me a joke",
                                    "callback_data": "tell me a joke"
                                }
                            ],
                            [
                                {
                                    "text": "Play some music",
                                    "callback_data": "play some music"
                                }
                            ]
                        ]
                    }
                }
            }
        ;
        agent.add(new Payload(agent.TELEGRAM, payload, { sendAsMessage: true, rawPayload: true }));
    }








    function addConsultationHandler(agent) {
        console.log('dog detected');
        let name = agent.parameters.dogname;
        db.collection("dogs").add({ name: name }); 
        agent.add(`hi dog, ${name}`);
    }

    let intentMap = new Map();
    intentMap.set('add homework', addHomeworkHandler);
    intentMap.set('view homework', getHomeworkHandler);
    intentMap.set('ask me a question - custom', wolframHandler);
    intentMap.set('Default Welcome Intent', welcomeHandler);
    // Default Welcome Intent
    agent.handleRequest(intentMap);
});

/*
'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });

  function getNameHandler(agent) {
    //console.log(agent.context.get());

    let name = agent.parameters.name;
console.log('abcdefghijklmnp');
    db.collection("names").add({ name: name });

    agent.add(`hell, ${name}`);

  }

    function getDogHandler(agent) {
      console.log('dog detected');
      let name = agent.parameters.dogname;
      db.collection("dogs").add({ name: name }); 
      agent.add(`hi dog, ${name}`);
    }

  let intentMap = new Map();
  intentMap.set('get name', getNameHandler);
  intentMap.set('welcomeback-bitches - custom', getDogHandler);
  agent.handleRequest(intentMap);
});
*/
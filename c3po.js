//
// Copyright (c) 2016 Cisco Systems
// Licensed under the MIT License 
//

/* 
 * a Cisco Spark bot that:
 *   - sends a welcome message as he joins a room, 
 *   - answers to a /hello command, and greets the user that chatted him
 *   - supports /help and a fallback helper message
 *
 * + leverages the "node-sparkclient" library for Bot to Cisco Spark communications.
 * 
 */

var SparkBot = require("node-sparkbot"),
    request = require('request'),
    cheerio = require('cheerio'),
    //avsnet = require('./AVSNET-Module1'),
    url = "http://itprice.com/cisco-gpl/",
    product = 'UWL',
    Poruka = '';
    //UWL                       100 proizvoda
    //UWL-MIG                   3 proizvoda
    //UWL-MIG-CUWLBE-PRO        1 proizvod
    //UCSS-U-AQM                16 proizvoda
var bot = new SparkBot();

// nodejs client to write back to Cisco Spark

//bot.interpreter.prefix = "#"; // Remove comment to overlad default / prefix to identify bot commands

var SparkAPIWrapper = require("node-sparkclient");
if (!process.env.SPARK_TOKEN) {
    console.log("Could not start as this bot requires a Cisco Spark API access token.");
    console.log("Please add env variable SPARK_TOKEN on the command line");
    console.log("Example: ");
    console.log("> SPARK_TOKEN=XXXXXXXXXXXX DEBUG=sparkbot* node 3cpo.js");
    process.exit(1);
}
var spark = new SparkAPIWrapper(process.env.SPARK_TOKEN);

// ********************************************************************************************** COMMANDS **********************
// Help and fallback commands
//
bot.onCommand("help", function (command) {
    spark.createMessage(command.message.roomId, "**Hi, I am C-3PO and I am here to help.**\n\nTo see me in action type :\n\n>hello\n\n>hi\n\n>url\n\n>**pp** *argument*\n\n", { "markdown":true }, function(err, message) {
        if (err) {
            console.log("WARNING: could not post message to room: " + command.message.roomId);
            return;
        }
    });
});

bot.onCommand("fallback", function (command) {
    spark.createMessage(command.message.roomId, "Sorry, I did not understand that.\n\nTry **help**.", { "markdown":true }, function(err, response) {
        if (err) {
            console.log("WARNING: could not post Fallback message to room: " + command.message.roomId);
            return;
        }
    });
});

//
// Bots commands here
// **********************************************************************************************************************

bot.onCommand("pp", function (command) {
    var ProductID = command.message.text;
    var ProductIDLength = 0;
    var ProductIDSpace = 0;
    
    console.log('Command Message Text '+ProductID);
    console.log(ProductID.indexOf(' ',0));
    ProductIDSpace=ProductID.indexOf(' ',0);
    
    console.log(ProductID.length);
    ProductIDLength = ProductID.length;
    
    ProductID = ProductID.substring(ProductIDSpace+1,ProductIDLength);
    console.log('Command :'+ProductID);
    product = ProductID;
    
    request(url+product, function(err,resp, body){
    var $ = cheerio.load(body);
    var naslov = $('.zui-table td');
    var naslovtext = naslov.text();
    ParsajTekst(naslovtext);
    spark.createMessage(command.message.roomId,  Poruka, { "markdown":true }, function(err, response) {
        if (err) {
            console.log("WARNING: could not post Fallback message to room: " + command.message.roomId);
            return;
        }
    });
    Poruka='';
     if (err) {
            console.log("WARNING!");
            return;
        }
});

});

function ParsajTekst(tekst){
    var DuzinaParsanogTeksta = tekst.length,
        SredenTekst = '',
        br=0, br2=0,
        BrojProizvoda=0,
        pointer$=0,
        pointerTocka=0,
        BrojProizvoda2=0,
        Proizvodi='';

//Micanje TAB tipke \t
    for (br=0; br<DuzinaParsanogTeksta; br++){
        if (tekst.substr(br,1) != '\t'){
            SredenTekst = SredenTekst + tekst.substr(br,1);
        }
    }
    tekst=SredenTekst;
    SredenTekst='';
    DuzinaParsanogTeksta = tekst.length;

//Micanje duplog razmaka
    for (br=0; br<DuzinaParsanogTeksta; br=br+2){
        if (tekst.substr(br,2) != '  '){
            SredenTekst = SredenTekst + tekst.substr(br,2);
        }
    }
    tekst=SredenTekst;
    SredenTekst='';
    DuzinaParsanogTeksta = tekst.length;

//Provjera dvostruke ENTER tipke \n
     for (br=0; br<DuzinaParsanogTeksta; br=br+2){
        if (tekst.substr(br,2) != '\n\n'){
            SredenTekst = SredenTekst + tekst.substr(br,2);
        }
    }
    tekst=SredenTekst;
    DuzinaParsanogTeksta = tekst.length;
    
//Odredivanje broja proizvoda
    for (br=0; br<DuzinaParsanogTeksta; br++){
        if (tekst.indexOf('$',pointer$) != -1){
            BrojProizvoda++;
            pointer$=tekst.indexOf('$',pointer$)+1;     //Pretrazivanje broja proizvoda po $ znaku
        }
    }
        
//Izvlacenje iznosa proizvoda
    pointer$ = 0;
    pointerTocka = 0;
    for (br=1; br<BrojProizvoda+1; br++){
        if (tekst.indexOf('$',pointer$) != -1){
            BrojProizvoda2++;
            pointer$=SredenTekst.indexOf('$',pointer$)+1;           //Pronadi poziciju $ znaka
            pointerTocka = pointer$ + 1;
            pointerTocka=SredenTekst.indexOf('.',pointerTocka)+1;    //Pronadi poziciju . znaka
            
            // Izvlacenje naziva proizvoda ************************************************************
                br2=pointer$-2;
                do {
                    br2--;
                } while (SredenTekst.substring(br2,br2+1)!=' ');
// ISPIS
            console.log('No#: ' + BrojProizvoda2 + ', Naziv proizvoda:  ' + SredenTekst.substring(br2+1,pointer$-2) + ', Product price USD:  ' + SredenTekst.substring(pointer$-1,pointerTocka+2));
            Poruka = Poruka + '>'+BrojProizvoda2 + ', ' + SredenTekst.substring(br2+1,pointer$-2) + ', **' + SredenTekst.substring(pointer$-1,pointerTocka+2)+'**\n\n';
            Proizvodi = Proizvodi + 'No#: ' + BrojProizvoda2 + ', Naziv proizvoda:  ' + SredenTekst.substring(br2+1,pointer$-2) + ', Product price USD:  ' + SredenTekst.substring(pointer$-1,pointerTocka+2) + '\n';
            if (BrojProizvoda2==100){
                Proizvodi = Proizvodi + '...';
                Poruka = Poruka + '>...';
            }
        }
    }
}
//***********************************************************************************************
bot.onCommand("bla", function (command) {
    //======================================================
    //-------------------- KEMIJANJE -----------------------
   // var product = ParsProduct(command.args[0]);
    // command.message - JSON podaci
    
    var ProductID = command.message.text;
    var ProductIDLength = 0;
    var ProductIDSpace = 0;
    
    console.log('*****************************************');
    console.log('*****************************************');
    //console.log(command.args[0]);
    console.log('Command Message Text '+ProductID);
    console.log(ProductID.indexOf(' ',0));
    ProductIDSpace=ProductID.indexOf(' ',0);
    
    console.log(ProductID.length);
    ProductIDLength = ProductID.length;
    
    ProductID = ProductID.substring(ProductIDSpace+1,ProductIDLength);
    console.log('Command :'+ProductID);
    
    console.log('*****************************************');
    console.log('*****************************************');
    
    //------------------------------------------------------
    
    spark.createMessage(command.message.roomId, "BLA", { "markdown":true }, function(err, message) {
        if (err) {
            console.log("WARNING: could not post Hello message to room: " + command.message.roomId);
            return;
        }
    });
});


bot.onCommand("hello", function (command) {
    var email = command.message.personEmail; // Spark User that created the message orginally 
    spark.createMessage(command.message.roomId, "Hello <@personEmail:" + email + ">", { "markdown":true }, function(err, message) {
        if (err) {
            console.log("WARNING: could not post Hello message to room: " + command.message.roomId);
            return;
        }
    });
});

bot.onCommand("hi", function (command) {
    spark.createMessage(command.message.roomId, "Hi, how are you?\n\n", { "markdown":true }, function(err, message) {
        if (err) {
            console.log("WARNING: could not post message to room: " + command.message.roomId);
            return;
        }
    });
});

bot.onCommand("url", function (command) {
    spark.createMessage(command.message.roomId, "**Your URLs are:**\n\n>https://www.google.com/\n\n>http://www.avsnet.co.uk/\n\n>https://www.cisco.com/\n\n>http://itprice.com/cisco-gpl/\n\n", { "markdown":true }, function(err, message) {
        if (err) {
            console.log("WARNING: could not post message to room: " + command.message.roomId);
            return;
        }
    });
});

//
// Welcome message 
// sent as the bot is added to a Room
//
bot.onEvent("memberships", "created", function (trigger) {
    var newMembership = trigger.data; // see specs here: https://developer.ciscospark.com/endpoint-memberships-get.html
    if (newMembership.personId != bot.interpreter.person.id) {
        // ignoring
        console.log("new membership fired, but it is not us being added to a room. Ignoring...");
        return;
    }

    // so happy to join
    console.log("bot's just added to room: " + trigger.data.roomId);
    
    spark.createMessage(trigger.data.roomId, "Hi, I am **C-3PO**.\n\n*To see how can you use me type:*\n\n***\n\nhelp\n\n***", { "markdown":true }, function(err, message) {
        if (err) {
            console.log("WARNING: could not post Hello message to room: " + trigger.data.roomId);
            return;
        }

        if (message.roomType == "group") {
            spark.createMessage(trigger.data.roomId, "**Note that this is a 'Group' room. I will wake up only when mentionned.**", { "markdown":true }, function(err, message) {
                if (err) {
                    console.log("WARNING: could not post Mention message to room: " + trigger.data.roomId);
                    return;
                }
            });
        }      
    }); 
});


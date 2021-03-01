// D&D bot
// version 0.6
// database active 

// global variables and constants ----------------------------------------------------------------------
const Discord = require('discord.js');
const client = new Discord.Client();
/* [0][i] = character name, [1] = strength, [2] = Dexterity, [3] = Intelligence, [4] = Wisdom, [5] = Health, [6] = coins */
const mysql = require('mysql');
var Temp = [];
const fs = require('fs');
var settings = require('./Settings.json');
const {
    error
} = require('console');
const {
    get
} = require('https');
var canvas = require('canvas');
const {
    getgid, title
} = require('process');
const { errorMonitor } = require('events');


// global variables and constants ----------------------------------------------------------------------

// initlization ----------------------------------------------------------------------
client.once('ready', () => {
    console.log('Initalizing D&D bot');

});

// database connection ----------------------------------------------------------------------
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "mydb"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Database Connected");
    var sql = "SELECT * FROM player_data"
    con.query(sql, function (err, result) {
        if (err) throw err;
    });
});
// database connection ---------------------------------------------------------------------- 

// functions ----------------------------------------------------------------------

function random(range) { // gives a random number
    var random = Math.floor(Math.random() * range);
    if (random == 0) {
        random = 1;
    }
    return random;
}

function ParcePingtoUserID(string) { // turns a ping into a user ID 
    array = string.split('')
    array.splice(0, 3);
    array.pop();
    string = array.join('');
    return string;
}

function EqualToList(Array, Possable_Element) { //if an element is equal to a array 

    for (var i = 0; i <= Array.length; i++) {
        if (Array[i] == Possable_Element) {
            return true;
        }
    }

    return false;
}

function luck(number) { // calulates luck
    maxluck = 30
    persent = number / maxluck * 100
    if (persent > random(maxluck)) {
        return true;
    }
    return false;
}

function getPlayerimage(ID) {
    const sql = "SELECT * FROM player_data WHERE playerID = " + ID + ";";
    con.query(sql, function (err, result) {
        return result.avatar;
    });
}

function getData() { // get Character Data from the Player_Data.txt
    var Data = fs.readFileSync('./Player_Data.txt', 'utf8');
    Data = Data.split("\n");
    for (var i = 0; i < Data.length; i++) {
        Data[i] = Data[i].split(" ");

        if (Data[i][0] === undefined) {
            console.log(Data[i][0]);
            Data.splice(Data[i], 1);
        }

        for (var e = 0; e < Data[i].length; e++) {
            if (Data[i][e] == '') {
                Data[i].splice(e);
            }

            
            if (e >= 12 && e + 1 <= 16 && Data[i][e + 1] != 'none' && Data[i][e + 1] != '0') {
                // come back to this part 
                if (Data[i][e] != 'none') {
                    Data[i][e] = Data[i][e] + " " + Data[i][e + 1];
                    Data[i].splice(e + 1, 1);
                }
                
            }

        }
    }

    return Data;
}

function writeData(PlayerIndex, ValueIndex, Newvalue) {
    var Data = getData();
    Data[PlayerIndex][ValueIndex] = Newvalue
    for (var i = 0; i < Data.length; i++) {
        Data[i] = Data[i].join(" ");
    }

    Data = Data.join('\n');

    fs.writeFileSync('Player_data.txt', Data, 'utf-8');
    return;
}

function NametoIndex(Name) { // my SQL name and gives out an index position of the name
    switch (Name) {
        case ('PlayerID'):
            return 0;
        case ('Player_name'):
            return 1;
        case ('Health'):
            return 2;
        case ('Mana'):
            return 3;
        case ('Type'):
            return 4;
        case ('Species'):
            return 5;
        case ('Attack'):
            return 6;
        case ('Magic'):
            return 7;
        case ('Magic_class'):
            return 8;
        case ('Defense'):
            return 9;
        case ('Speed'):
            return 10;
        case ('Luck'):
            return 11;
        case ('Item1'):
            return 12;
        case ('Item2'):
            return 13;
        case ('Item3'):
            return 14;
        case ('Item4'):
            return 15;
        case ('Item5'):
            return 16;
        case ('Bars'):
            return 17;
        case ('Armour'):
            return 18;
        case ('avatar'):
            return 19;
        default:
            throw 'not in player data';
            break;
    }

    return;
}

function NextItem(array) { // gets the next empty item otherwise it will give 0
    for (var i = 0; i < array.length; i++) {
        if (array[i] == 'none') {
            return i;
        }
    }
    return 0;
}

function Error(msg) { // Standered Error message 
    const embed = new Discord.MessageEmbed();
    embed.setTitle('Uh Oh')
        .setDescription("**" + msg + "**")
        .setColor('#FF0000');

    return embed;
}

function DisplayMode(array) { // adds spaces to an array and throws away 'none'
    for (var i = 0; i < array.length; i++) {
        if (array[i] === 'none') {
            array.splice(i);
        }
    }
    return array.join(" ");
}

function itemRefresh(PlayerID) { // adds all the stats (Note: that this should only be used once a character doesn't have any items stats)
    var items = [];
    var total = [0, 0, 0, 0, 0];
    const stats = ["Attack", "Magic", "Defense", "Speed", "Luck"];

    con.query("SELECT Item1,Item2,Item3,Item4,Item5 FROM Player_data WHERE playerID =" + PlayerID, function (err, result) {

        result = JSON.parse(JSON.stringify(result));
        for (var i = 0; i < 5; i++) {
            items[i] = eval('result[0].Item' + (i + 1));
        }

        for (var i = 0; i < items.length; i++) {
            con.query("SELECT * FROM items WHERE item_name = '" + items[i] + "'", function (err, result) {
                result = JSON.parse(JSON.stringify(result));
                total[0] = total[0] + result[0].Attack;
                total[1] = total[1] + result[0].Magic;
                total[2] = total[2] + result[0].Defense;
                total[3] = total[3] + result[0].Speed;
                total[4] = total[4] + result[0].Luck;
            });

        }

        con.query("SELECT * FROM player_data", function (err) {
            for (var i = 0; i < 5; i++) {
                var sql = "UPDATE player_data SET " + stats[i] + " = " + stats[i] + " + " + total[i] + " WHERE playerID = " + PlayerID;
                con.query(sql, function (err, result) {

                });
            }
        });
    });

}

function BattleField() {
    var i, i_length = 16
    e, e_length = 10, BattleField = [];

    for (var i = 0; i < i_length; i++) {
        BattleField[i] = [];
        for (var e = 0; e < e_length; e++) {
            BattleField[i][e] = '';
        }
    }

    return BattleField;
}

function getCurrentPlayerTurnID(Active_Party, count, element) { // continue this
    if (Active_Party == true) {
        return getData()[count][NametoIndex(element)];
    }
}


async function DisplayBattleField(message) {
    battle = fs.readFileSync('./battle.txt', 'utf8');
    battle = battle.split("\n");
    if (IsbattleON()) {

        for (var i = 0; i < battle.length; i++) {
            battle[i] = battle[i].split(",");
        }

        for (var i = 0; i < battle.length; i++) {
            for (var e = 0; e < battle[i].length; e++) {
                if (battle[i][e] == '') {
                    battle[i][e] = '*';
                }
            }
        }

        battle.pop();
    }

    const Canvas = canvas.createCanvas(512, 400);
    const ctx = Canvas.getContext('2d');
    const background = await canvas.loadImage('depositphotos_1208368-stock-photo-white-paper-seamless-background.jpg');
    const avatar = await canvas.loadImage('blank.jpg');
    const embed = new Discord.MessageEmbed();
    await ctx.drawImage(background, 0, 0, Canvas.width, Canvas.height);

    for (var i = 0; i < 16; i++) {
        for (var e = 0; e < 10; e++) {
            if (battle[i][e] != '*') {
                for (var u = 0; u < getData().length; u++) {
                    if (battle[i][e] == getData()[u][NametoIndex('Player_name')]) {
                        const image = await canvas.loadImage(getData()[u][NametoIndex('avatar')])
                        ctx.drawImage(image, i * 32, e * 20 * 2, 30, 18*2);
                    }
                }

                for (var u = 0; u < getEnemyData().length; u++) {
                    if (battle[i][e] == getEnemyData()[u][0]) {
                        const image = await canvas.loadImage(getEnemyData()[u][18])
                        ctx.drawImage(image, i * 32, e * 20 * 2, 30, 18*2);
                    }
                    
                }
            }

            if (battle[i][e] == '*') {
                ctx.drawImage(avatar, i * 32, e * 20 * 2, 30, 18*2);
            }

        }
    }

    const attachment = new Discord.MessageAttachment(Canvas.toBuffer(), 'depositphotos_1208368-stock-photo-white-paper-seamless-background.jpg');
    message.channel.send(attachment);
}


function cycle(Active_party, addby, count) { // continue this 
    if (Active_party == true) {
        count = count + addby;

        if (count > (getData().length - 1)) {
            count = 0;
        }

        return getData()[count][NametoIndex("PlayerID")];
    }

    return 0;
}

function getEnemyData() { // test this 
    var Data = fs.readFileSync('./Enemy_data.txt', 'utf8');
    Data = Data.split("\n");
    for (var i = 0; i < Data.length; i++) {
        Data[i] = Data[i].split(" ");
        for (var e = 0; e < Data[i].length; e++) {
            if (Data[i][e] == '') {
                Data[i].splice(e);
            }
        }

    }

    return Data;
}

function writeEnemyData(PlayerIndex, ValueIndex, Newvalue) { // test this
    Data = getEnemyData();
    Data[PlayerIndex][ValueIndex] = Newvalue
    for (var i = 0; i < Data.length; i++) {
        Data[i] = Data[i].join(" ");
    }

    Data = Data.join('\n');

    fs.writeFileSync('Enemy_data.txt', Data, 'utf-8');
}

function partySave() { // save the current party state to the database // test this 
    var Data = getData();
    var stats = ["PlayerID", "Player_name", "Health", "Mana", "Type", "Species", "Attack", "Magic", "Magic_class", "Defense", "Speed", "Luck", "Item1", "Item2", "Item3", "Item4", "Item5", "Bars", "Armour"];
    for (var i = 0; i < Data.length; i++) {
        for (var e = 0; e < Data[i].length; e++) {
            sql = "update Player_data SET " + stats[e] + " = " + Data[i][e] + " Where PlayerID = " + Data[i][0];

            con.query(sql, function (err, result) {
                1;
            });
        }
    }
}

function itemSwap(ItemIndex ,Item2, playerIndex) {
    var items = [getData()[playerIndex][NametoIndex("Item1")], getData()[playerIndex][NametoIndex("Item2")], getData()[playerIndex][NametoIndex("Item3")], getData()[playerIndex][NametoIndex("Item4")], getData()[playerIndex][NametoIndex("Item5")]];
    items[ItemIndex] = Item2;
    for (var i = 0; i < items.length; i++){
        writeData(playerIndex, (i+1) + 11, items[i]);
    }
}

function itemDis(ItemIndex, playerIndex) {
    writeData(playerIndex, ItemIndex+1 + 11, 'none');
    return;
}

function itemsort(playerIndex) {
    var items = [getData()[playerIndex][NametoIndex("Item1")], getData()[playerIndex][NametoIndex("Item2")], getData()[playerIndex][NametoIndex("Item3")], getData()[playerIndex][NametoIndex("Item4")], getData()[playerIndex][NametoIndex("Item5")]];
    var NewItems = [];
    var u = 0;
    for (var i = 0; i < items.length; i++) {
        if (items[i] != 'none') {
            NewItems[u] = items[i];
            u++;
        }
    
    }

    for (var i = 0; i < 5; i++) {
        if (NewItems[i] != undefined) {
            continue;
        } else {
            NewItems[i] = 'none';
        }
    }

    for (var i = 0; i < NewItems.length; i++) {
        writeData(playerIndex, 11 + (i+1), NewItems[i]);
    }
    
}   

function itemPickup(Item, playerIndex) {
    isfull = true;
    var items = [getData()[playerIndex][NametoIndex("Item1")], getData()[playerIndex][NametoIndex("Item2")], getData()[playerIndex][NametoIndex("Item3")], getData()[playerIndex][NametoIndex("Item4")], getData()[playerIndex][NametoIndex("Item5")]];
    for(var i = 0; i < items.length; i++){
        if('none' == items[i]) {
            isfull = false;
            break;
        } else {
            isfull = true;
        }
    }

    if(isfull) {
        return 0;
    }

    for (var i = 0; i < items.length; i++){
        if('none' == items[i]) {
            items[i] = Item;
            writeData(playerIndex, (i+1) + 11, items[i]);
            return;
        }

        console.log((i+1) + 11 + ":" + items[i]);   
    }

}

function GetbattleData() {
    battle = fs.readFileSync('./battle.txt', 'utf8');
    battle = battle.split("\n");
    if (IsbattleON()) {

        for (var i = 0; i < battle.length; i++) {
            battle[i] = battle[i].split(",");
        }

        battle.pop();
    }

    return battle;

}

function writeBattleData(object, posX, posY) {
    var Data = GetbattleData();
    var name;
    for (var i = 0; i < Data.length; i++) {
        for (var e = 0; e < Data[i].length; e++) {
            if (Data[i][e] == object) {
                Name = Data[i][e];
                Data[i][e] = ''; 
            }
        }
    }

    for (var x = 0; x < Data.length; x++) {
        for (var y = 0; y < Data[x].length; y++) {
            if (posX == x && posY == y) {
                Data[x][y] = Name;
            }
        } 
    }

    fs.writeFileSync('./battle.txt', '', 'utf8');
    for (var i = 0; i < Data.length; i++) {
        fs.appendFileSync('./battle.txt', Data[i], 'utf8');
        fs.appendFileSync('./battle.txt', '\n', 'utf8');
    }


}



function IsActive_Party() {
    Data = getData();
    if (Data[0][0] == undefined) {
        return false;
    }
    return true;
}

function IsbattleON() {
    Data = getEnemyData();
    if (Data[0][0] == undefined) {
        return false;
    }
    return true;
}

// functions ---------------------------------------------------------------------- end 

if (IsActive_Party() == true) {
    var Active_Party = true;
}

if (Active_Party == true) {
    var count = 0;
}

// initlization ---------------------------------------------------------------------- end 

// offline testing zone --------------------------------------------------------------

// offline testing zone -------------------------------------------------------------- end 

// when message is sent ----------------------------------------------------------------------
client.on('message', message => {
    if (message.author.id != '753297709171212389') {
        command = message.content.toLowerCase().split(" ");
    } else {
        return;
    }


    if (IsbattleON() == true && command[0] != "music" && !message.member.roles.cache.has('754721192413495337')) {
        var vaild = false;
        var PlayerRow = 0;
        for (var i = 0; i < getData().length; i++) {
            if (getData()[i][0] == message.author.id) {
                PlayerRow = i;
                break;
            }
        }

        if (message.author.id != getCurrentPlayerTurnID(IsActive_Party(), count, "PlayerID")) {
            message.channel.send("its " + getCurrentPlayerTurnID(IsActive_Party(), count, "Player_name") + "'s turn... ");
            return;
        }

        if (command[0] == undefined) {
            const mess = new Discord.MessageEmbed();
            mess.setDescription("** please use a command from these 'use', 'move', 'attack', 'magic' **");
            message.channel.send(mess);
            return;
        }

        if (command[0] == 'help') {
            const mess = new Discord.MessageEmbed();
            mess.setDescription("** 'use' - use an item, 'move' - move character, 'attack' - attack enemy (close range), 'magic' - attack enemy (close/far range) **");
            message.channel.send(mess);
            return;
        }
        // handling 

        if (command[0] == 'view') {
            DisplayBattleField(message);
        }

        // Fight comands
        if (command[0] == 'use') { // using items // test this
            items = [getData()[PlayerRow][NametoIndex("Item1")], getData()[PlayerRow][NametoIndex("Item2")], getData()[PlayerRow][NametoIndex("Item3")], getData()[PlayerRow][NametoIndex("Item4")], getData()[PlayerRow][NametoIndex("Item5")]];
            command.splice(0, 1);
            console.log(command);

            let filter = m => m.author.id === message.author.id;

            const embed = new Discord.MessageEmbed();
            embed.setTitle("**" + getData()[PlayerRow][NametoIndex('Player_name')] + "'s inventory **");
            embed.addField("Item " + 1, items[0], true);
            embed.addField("Item " + 2, items[1], true);
            embed.addField("Item " + 3, items[2], true);
            embed.addField("Item " + 4, items[3], true);
            embed.addField("Item " + 5, items[4], true);
            embed.setColor('#F80800');
            embed.setDescription("type up an item to use (Note using a sword is acceptable but will do nothing and you will lose a turn, you will also lose the sword) \n you can use 'on' after and then another [@Player name] if you choose youself it will apply to ur self you can only do one potion a turn");
            message.channel.send(embed);
            
            message.channel.awaitMessages(filter, {
                max: 1
            }).then(collected => {
                command = collected.first().content.split(" ");

            if (command[0] == undefined) {
                message.channel.send(Error("looks like you haven't entered and item"));
                return;
            }

            if (command[1] == undefined) {
                message.channel.send(Error("looks like you haven't entered a proper item"));
                return;
            }

            var u = 0;
            for (var i = 0; i <= items.length; i++) {
                if (items[i] == command[0] + " " + command[1]) {
                    if (command[2] == 'on') {
                        if (command[3][0].toString() == '<' && command[3][1].toString() == '@') {
                            command[3] = ParcePingtoUserID(command[3].toString());
                            for (var i = 0; i < getData().length; i++) {
                                if (command[3] == getData()[i][0]) {
                                    PlayerRow = i;
                                }
                            }
                        }

                        command[1] = command[1][0].toUpperCase() + command[1].slice(1);
                        command[0] = command[0][0].toUpperCase() + command[0].slice(1);

                        const sql = "SELECT * FROM items WHERE item_name = '"  + command[0] + " " +  command[1] + "'"
                        con.query(sql , function (err, result) {
                            if (result[0] == undefined) { message.channel.send(Error("you didn't enter a real item maybe check your spelling")); return;}
                            writeData(PlayerRow, NametoIndex("Health"), result[0].HP + parseInt(getData()[PlayerRow][NametoIndex("Health")]));
                            writeData(PlayerRow, NametoIndex("Mana"), result[0].Mana + parseInt(getData()[PlayerRow][NametoIndex("Mana")]));

                            const embed = new Discord.MessageEmbed();
                            if (result[0].HP > 0) {
                                embed.setDescription("**" + getData()[PlayerRow][NametoIndex('Player_name')] + " Health: "+ getData()[PlayerRow][NametoIndex('Health')] +"   **");
                            } else if (result[0].Mana > 0) {
                                embed.setDescription("**" + getData()[PlayerRow][NametoIndex('Player_name')] + " Mana: "+ getData()[PlayerRow][NametoIndex('Mana')] +"   **");
                            } else {
                                embed.setDescription("**" + getData()[PlayerRow][NametoIndex('Player_name')] + " Health: " + getData()[PlayerRow][NametoIndex('Health')] +"** \n" + "**" + getData()[PlayerRow][NametoIndex('Player_name')] + " Mana: "+ getData()[PlayerRow][NametoIndex('Mana')] +"   **");
                            }

                            message.channel.send(embed);
                            DisplayBattleField(message);
                            vaild = true;
                        });
                        return;
                    } 

                    if (command[2] == undefined) {
                        command[1] = command[1][0].toUpperCase() + command[1].slice(1);
                        command[0] = command[0][0].toUpperCase() + command[0].slice(1);

                        const sql = "SELECT * FROM items WHERE item_name = '"  + command[0] + " " +  command[1] + "'";

                        con.query(sql, function (err ,result) {
                            if (result[0] == undefined) { message.channel.send(Error("you didn't enter a real item maybe check your spelling")); return;}
                            writeData(PlayerRow, NametoIndex("Health"), result[0].HP + parseInt(getData()[PlayerRow][NametoIndex("Health")]));
                            writeData(PlayerRow, NametoIndex("Mana"), result[0].Mana + parseInt(getData()[PlayerRow][NametoIndex("Mana")]));
                            writeData(PlayerRow, 11+(i+1), 'none');
                            const embed = new Discord.MessageEmbed();
                            if (result[0].HP > 0) {
                                embed.setDescription("**" + getData()[PlayerRow][NametoIndex('Player_name')] + " Health: "+ getData()[PlayerRow][NametoIndex('Health')] +"   **");
                            } else if (result[0].Mana > 0) {
                                embed.setDescription("**" + getData()[PlayerRow][NametoIndex('Player_name')] + " Mana: "+ getData()[PlayerRow][NametoIndex('Mana')] +"   **");
                            } else {
                                embed.setDescription("**" + getData()[PlayerRow][NametoIndex('Player_name')] + " Health: " + getData()[PlayerRow][NametoIndex('Health')] +"** \n" + "**" + getData()[PlayerRow][NametoIndex('Player_name')] + " Mana: "+ getData()[PlayerRow][NametoIndex('Mana')] +"   **");
                            }

                            message.channel.send(embed);
                            DisplayBattleField(message);
                            vaild = true;
                        });
                        return;
                    }
                } 
            };
        });
    }

        if (command[0] == 'move') { // moving character
            const dir = ["up", "down", "left", "right"];
            iter = 0;

            // error handling 

            for (var i = 0; i < dir.length; i++) {
                if (command[1] == dir[i]) {
                    break;
                } else {
                    iter = iter + 1;
                }   
            }   
            if (iter >= 4) {
                message.channel.send(Error("looks like you forgot to enter either " + DisplayMode(dir)));
                return;
            }

            if (isNaN(command[2])) {
                message.channel.send(Error("please enter a vaild number"));
                return;
            }

            command[2] = parseInt(command[2]);

            const ran = random(12);
            if (command[2] > ran) {
                command[2] = ran;
            }

            const embed = new Discord.MessageEmbed();
            embed.title = "You Rolled";
            embed.setDescription(ran + " you move " + command[2] + " steps");
            message.channel.send(embed);

            const Data = GetbattleData();
            console.log(GetbattleData());
            var x = 0;
            var y = 0;
            for (var i = 0; i < Data.length; i++) {
                for (e = 0; e < Data[i].length; e++) {
                    if (getData()[PlayerRow][NametoIndex('Player_name')] == Data[i][e]) {
                        x = i;
                        y = e;
                    }
                }
            }

            console.log("value: " + Data[x][y]);
            
            if (Data[x][y] != '') {
                message.channel.send(Error('you cannot move on top of an enemy'));
                return;
            }

            console.log(Data[x][y]);

            switch (command[1]) {
                case 'up':

                    if (y-command[2] < 0) {
                        command[2] = 0; 
                        y = 0;
                    }

                    writeBattleData(getData()[PlayerRow][NametoIndex('Player_name')], x, y-command[2]);
                    break;
                case 'down':
                    if (y+command[2] > 9) {
                        command[2] = 0;
                        y = 9; 
                    }
                    
                    writeBattleData(getData()[PlayerRow][NametoIndex('Player_name')], x, y+command[2]);
                    break;
                case 'left':
                    if (x - command[2] < 0) {
                        x = 0;
                        command[2] = 0;
                    }
                    
                    writeBattleData(getData()[PlayerRow][NametoIndex('Player_name')], x - command[2], y);
                    break;
                case 'right':
                    if ( x + command[2] > 15) {
                        command[2] = 0;
                        x = 15;
                    }

                    writeBattleData(getData()[PlayerRow][NametoIndex('Player_name')], x + command[2], y);
                    break;
            
                default:
                    message.channel.send(Error("looks like there was a fatal error please contact someone to fix this bug"));
                    break;
            }
            
            DisplayBattleField(message);
            vaild = true;
        }

        if (command[0] == 'attack') { // attacking enemy (close range)
            // check if enemy player is infront of player
            const Name = getData()[PlayerRow][NametoIndex('Player_name')];
            var battle = GetbattleData()
            var x = 0;
            var y = 0;
            const Data = GetbattleData();
            var x = 0;
            var y = 0;
            for (var i = 0; i < Data.length; i++) {
                for (e = 0; e < Data[i].length; e++) {
                    if (getData()[PlayerRow][NametoIndex('Player_name')] == Data[i][e]) {
                        x = i;
                        y = e;
                    }
                }
            }

            var Enemyrow = 0;
            if (battle[x+1][y] != '' ) {
                for (var i = 0; i < getEnemyData().length; i++) {
                    for (var e = 0; e < getEnemyData()[i].length; i++) {
                        if (getEnemyData()[i][e] == battle[x+1][y]) {
                            Enemyrow = i;
                            break;
                        }
                    }
                   
                }

                var att = parseInt(getData()[PlayerRow][NametoIndex('Attack')]);
                console.log(att);
                if (luck(getData()[PlayerRow][NametoIndex('Luck')])) {
                   att = att + parseInt(getData()[PlayerRow][NametoIndex('Luck')]);
                   console.log(att);
                }

                if (att - parseInt(getEnemyData()[Enemyrow][4]) <= 0) {
                    const embed = new Discord.MessageEmbed();
                    embed.setDescription('your attack couldn\'t break the enemy defence your enemy survived with **' + (parseInt(getEnemyData()[Enemyrow][4]) - att) + ' armour**');
                    embed.setColor('#FF0000');
                    message.channel.send(embed);
                    DisplayBattleField(message);
                    return;
                }
                console.log(att);

                att = att - parseInt(getEnemyData()[Enemyrow][4]);
                var dmg = parseInt(getEnemyData()[Enemyrow][1] - att);
                console.log(dmg);
                writeEnemyData(Enemyrow, 1, dmg);

                const embed = new Discord.MessageEmbed();
                embed.setDescription('you hit the enemy the enemy with **' + att + '** damage\n**enemy health: ' + getEnemyData()[Enemyrow][1] + '**');
                embed.setColor('#FF0000');
                message.channel.send(embed);
                DisplayBattleField(message);
            }

            if (getEnemyData()[Enemyrow][1] <= 0) {                
                var data = getEnemyData();
                writeBattleData(data[Enemyrow][0],x+1, y)

                data.splice(Enemyrow);
                console.log(data);

                for (var i = 0; i < data.length; i++) {
                    data[i] = data[i].join(" ");
                }

                data = data.join('\n');
                fs.writeFileSync('Enemy_data.txt', data, 'utf-8');

            }

            vaild = true;
        }

        if (command[0] == 'magic') { // attack enemy (close/far range)
            vaild = true;
        }

        if (vaild == true) {
            // enemy turn; 


            if (command[0] == 'move') { // moving character
                const dir = ["up", "down", "left", "right"];
        
                vaild = true;
            }

            if (command[0] == 'attack') { // attacking enemy (close range)

                vaild = true;
            }

            if (command[0] == 'magic') { // attack enemy (close/far range)

                vaild = true;
            }

            count++;
        }

    }

    // Music ----------
    if (command[0] === "music") { // playing music

    }
    // Music ----------

    if (command[0] === "d&d") { // start command for adventure commands

        if (command[1] == 'res') {
            writeBattleData('don', 0, 0);
        }

        if (command[1] == undefined) {
            // introduce them to D&D bot and what to do
            return;
        }

        if (command[1] == 'battle') {
            // battle 2 eniame slimes // test this

            var ands = 1;

            for (var i = 0; i < command.length; i++) {
                if (command[i] == 'and') {
                    ands++;
                }
            }

            for (var i = 0; i <= ands; i++) {}

            if (!message.member.roles.cache.has('754721192413495337')) {
                const embed = new Discord.MessageEmbed();
                embed.setDescription("**only the game master can preform this action**");
                message.channel.send(embed);
                return;
            }

            if (IsActive_Party() != true) {
                message.channel.send(Error("uh oh looks like you haven't yet activated a party do so by entering D&D party @[player]"));
                return;
            }

            if (command[2] == undefined) {
                message.channel.send(Error("Please add the number of attackers and then the Group and then attacker Name"));
                return;
            }

            if (isNaN(command[2])) {
                message.channel.send(Error("Please make sure you entered a number"));
                return;
            } else if (command[2] > 9) {
                message.channel.send(Error("Too many attackers"));
                return;
            }

            command[2] = parseInt(command[2]);

            if (command[3] != 'enemies' && command[3] != 'player' && command[3] != 'bosses') {
                message.channel.send(Error("Please choose a vaild class or table from enemies, player, bosses"));
                return;
            } else {
                switch (command[3]) {
                    case 'enemies':
                        var type = 'Enemy_Name'
                        break;
                    case 'player':
                        var type = 'Player_name'
                        break;
                    case 'bosses':
                        var type = 'Boss_name'
                        break;
                }

            }



            if (command[4] == undefined) {
                message.channel.send(Error("Please choose a add an attackers name"));
            }


            command[4] = command[4][0].toUpperCase() + command[4].slice(1);


            var sql = "SELECT * FROM " + command[3] + " WHERE " + type + " = '" + command[4] + "'";
            con.query(sql, function (err, result) {
                if (result[0] == undefined) {
                    message.channel.send(Error("you didn't give a proper name for your attacker"));
                    return;
                }

                battle = BattleField();
                var enemy_name = eval("result[0]." + type);
                // fill in the battle field

                switch (command[3]) {
                    case 'enemies':
                        var data = [result[0].Enemy_Name, result[0].HP, result[0].Species, result[0].Attack, result[0].Defense, result[0].Magic, result[0].Speed, result[0].Luck, result[0].Drops, result[0].Attack1, result[0].Attack1range, result[0].Attack2, result[0].Attack2range, result[0].Attack3, result[0].Attack3range, result[0].Attack4, result[0].Attack4range, result[0].Attack5, result[0].image];
                        break;
                    case 'player':
                        var data = [result[0].PlayerID, result[0].Player_name, result[0].Health, result[0].Mana, result[0].Type, result[0].Species, result[0].Attack, result[0].Magic, result[0].Magic_class, result[0].Defense, result[0].Speed, result[0].Luck, result[0].Item1, result[0].Item2, result[0].Item3, result[0].Item4, result[0].Item5, result[0].Bars, result[0].Armour];
                        break;
                    case 'bosses':
                        var data = [] // come back to this
                        break;
                }

                var pattY = [10, 12, 14];
                var pattX = [2, 5, 8];
                var form = [
                    [9, 7, 8],
                    [3, 1, 2],
                    [6, 4, 5]
                ];
                var u = 0;
                for (var i = 0; i <= 16; i++) {
                    for (var e = 0; e < 11; e++) {
                        for (var o = 0; o < 3; o++) {
                            if (i == pattY[o]) {
                                for (var a = 0; a < 3; a++) {
                                    if (e == pattX[a]) {



                                        if (form[o][a] > command[2]) {
                                            continue;
                                        }

                                        if (form[o][a] <= command[2]) {
                                            battle[i][e] = enemy_name + form[o][a];
                                            data[0] = data[0] + form[o][a];
                                            for (var y = 0; y < data.length; y++) {
                                                fs.appendFileSync('./Enemy_data.txt', data[y] + " ");
                                            }

                                            fs.appendFileSync('./Enemy_data.txt', "\n", battle);
                                            
                                            data[0] = enemy_name;
                                        }

                                    }
                                }
                            }
                        }
                    }
                }

                var pattY = [5, 3, 1];
                var form = [
                    [9, 7, 8],
                    [3, 1, 2],
                    [6, 4, 5]
                ];
                var u = 0
                for (var i = 0; i <= 16; i++) {
                    for (var e = 0; e < 11; e++) {
                        for (var o = 0; o < 3; o++) {
                            if (i == pattY[o]) {
                                for (var a = 0; a < 3; a++) {
                                    if (e == pattX[a]) {

                                        if (form[o][a] > getData().length) {
                                            continue;
                                        }

                                        if (form[o][a] <= getData().length) {
                                            battle[i][e] = getData()[u][NametoIndex("Player_name")];
                                            if (battle[i][e] == undefined) {
                                                battle[i][e] = '';
                                            }
                                            u++;
                                            continue;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                for (var i = 0; i < battle.length; i++) {
                    fs.appendFileSync('./battle.txt', battle[i], 'utf8');
                    fs.appendFileSync('./battle.txt', '\n', 'utf8');
                }

                console.log(battle);

                battleON = true;
                const embed = new Discord.MessageEmbed();

                embed.setDescription("**the Whole party is now in Battle mode**")
                    .setFooter("no one can use normal commands except the game master")
                    .setColor('#FF0044');
                message.channel.send(embed);

                DisplayBattleField(message);
            })
        }

        if (command[2] != "save") {
            if (command[1][0].toString() == '<' && command[1][1].toString() == '@') {
                for (var i = 0; i < getData().length; i++) {
                    command[1] = ParcePingtoUserID(command[1].toString());

                    if (command[1] == getData()[i][0]) {
                        var player = i;
                    }
                }
            }

            if (player != undefined) {
                const embed = new Discord.MessageEmbed();
                inv = [getData()[player][NametoIndex('Item1')], getData()[player][NametoIndex('Item2')], getData()[player][NametoIndex('Item3')], getData()[player][NametoIndex('Item4')], getData()[player][NametoIndex('Item5')]]
                embed.setTitle(getData()[player][NametoIndex('Player_name')])
                    .setAuthor('Player Stats')
                    .setDescription(
                        "Health: **" + getData()[player][NametoIndex('Health')] + "**\n" +
                        "Mana: **" + getData()[player][NametoIndex('Mana')] + "**\n" +
                        "Type: **" + getData()[player][NametoIndex('Type')] + "**\n" +
                        "Species: **" + getData()[player][NametoIndex('Species')] + "**\n" +
                        "Attack: **" + getData()[player][NametoIndex('Attack')] + "**\n" +
                        "Magic: **" + getData()[player][NametoIndex('Magic')] + "**\n" +
                        "Magic Class: **" + getData()[player][NametoIndex('Magic_class')] + "**\n" +
                        "Defense: **" + getData()[player][NametoIndex('Defense')] + "**\n" +
                        "Speed: **" + getData()[player][NametoIndex('Speed')] + "**\n" +
                        "Luck: **" + getData()[player][NametoIndex('Luck')] + "** \n" +
                        "Bars: **" + getData()[player][NametoIndex('Bars')] + "**\n").
                addField("Inventory:", "**" + DisplayMode(inv) + "**", true).
                setThumbnail(client.users.cache.find(user => user.id === getData()[player][NametoIndex('PlayerID')]).displayAvatarURL()).
                setColor('#F00000');

                message.channel.send(embed);
            }

            if (command[2] == 'add' && message.member.roles.cache.has('754721192413495337')) { // test this

                if (command[3] == undefined) {
                    message.channel.send(Error("Please enter a number after 'add' "));
                }

                command[3] = parseInt(command[3]);

                if (command[4] != 'to') {
                    message.channel.send(Error("please add 'to' after your number"));
                }

                const stats = ["Attack", "Magic", "Defense", "Speed", "Luck", "Health", "Mana", "Bars"];

                if (command[5] == undefined) {
                    message.channel.send(Error("Please give a stat to add to"));
                }
                command[5] = command[5][0].toUpperCase() + command[5].slice(1);
                if (!EqualToList(stats, command[5])) {
                    message.channel.send(Error("please choose a stat between" + DisplayMode(stats)));
                }
                // error handling ------ end

                const change = parseInt(getData()[player][NametoIndex(command[5])]) + command[3];
                writeData(player, NametoIndex(command[5]), change);
                const embed = new Discord.MessageEmbed();
                embed.setDescription(getData()[player][1] + "'s " + command[5] + " " + getData()[player][NametoIndex(command[5])]);
                message.channel.send(embed);

            }

            if (command[2] == 'sub' && message.member.roles.cache.has('754721192413495337')) { // test this
                const stats = ["Attack", "Magic", "Defense", "Speed", "Luck", "Health", "Mana", "Bars"];

                if (command[3] == undefined) {
                    message.channel.send(Error("Please enter a number after 'sub' "));
                }

                command[3] = parseInt(command[3]);

                if (command[4] != 'from') {
                    message.channel.send(Error("please add 'from' after your number"));
                }

                if (command[5] == undefined) {
                    message.channel.send(Error("Please give a stat to subtract from"));
                }
                command[5] = command[5][0].toUpperCase() + command[5].slice(1);
                if (!EqualToList(stats, command[5])) {
                    message.channel.send(Error("please choose a stat between" + DisplayMode(stats)));
                }
                // error handling ------ end

                const change = parseInt(getData()[player][NametoIndex(command[5])]) - command[3];
                writeData(player, NametoIndex(command[5]), change);
                const embed = new Discord.MessageEmbed();
                embed.setDescription(getData()[player][1] + "'s " + command[5] + " " + getData()[player][NametoIndex(command[5])]);
                message.channel.send(embed);

            }
        }



        if (command[1] === "bars") {
            const stats = ["Attack", "Magic", "Defense", "Speed", "Luck"];

            var player;

            for (var i = 0; i < getData().length; i++) {
                if (message.author.id === getData()[i][0]) {
                    player = i;
                }
            }

            if (player == undefined) {
                message.channel.send(Error("looks likes the user doesn't exist if you think this is wrong please report this bug"));
            }


            const embed = new Discord.MessageEmbed();


            embed.addField(getData()[player][NametoIndex("Player_name")] + "'s Bars", getData()[player][NametoIndex("Bars")], false);
            if (getData()[player][NametoIndex("Bars")] == 0) {
                embed.setDescription("**your bars are 0 you cannot add any stats**");
                embed.setColor('#FF0000');
                message.channel.send(embed);
                return;
            }

            message.channel.send(embed);

            const embed1 = new Discord.MessageEmbed();
            embed1.setDescription("now enter your number and then the word 'to' and then enter your stat E.G. '2 to attack'");
            message.channel.send(embed1);

            let filter = m => m.author.id === message.author.id;

            message.channel.awaitMessages(filter, {
                max: 1
            }).then(collected => {
                command = collected.first().content.split(" ");

                // error handling
                if (command[0] == undefined) {
                    const embed2 = new Discord.MessageEmbed();
                    embed2.setDescription("Command was cancelled" + "**nothing has changed **");
                    message.channel.send(embed2);
                    return;
                }


                if (command[1] != 'to') {
                    const embed2 = new Discord.MessageEmbed();
                    embed2.setDescription("please add 'to' after ");
                    message.channel.send(embed2);
                    return;
                }

                if (command[2] == undefined) {
                    const embed2 = new Discord.MessageEmbed();
                    embed2.setDescription("Command was cancelled" + "**nothing has changed **");
                    message.channel.send(embed2);
                    return;
                }

                command[2] = command[2][0].toUpperCase() + command[2].slice(1);

                command[0] = parseInt(command[0]);
                if (command[2] == 'Attack') {
                    Newbars = getData()[player][NametoIndex("Bars")] - command[0]
                    if (Newbars < 0) {
                        message.channel.send(Error("looks like you added more bars then you have to the stat please try again nothing has changed"));
                        return;
                    }

                    command[0] = command[0] * 5 + parseInt(getData()[player][NametoIndex(command[2])])

                    writeData(player, NametoIndex("Bars"), Newbars);
                } else {
                    Newbars = getData()[player][NametoIndex("Bars")] - command[0]
                    if (Newbars < 0) {
                        message.channel.send(Error("looks like you added more bars then you have to the stat please try agai nothing has changed"));
                        return;
                    }
                    command[0] = command[0] * 2 + parseInt(getData()[player][NametoIndex(command[2])])
                    writeData(player, NametoIndex("Bars"), Newbars);
                }

                writeData(player, NametoIndex(command[2]), command[0]);
                const embed4 = new Discord.MessageEmbed();
                embed4.setDescription(getData()[player][NametoIndex("Player_name")] + "'s " + command[2] + ": " + getData()[player][NametoIndex(command[2])]);
                message.channel.send(embed4);

            })



        }

        if (command[1] === 'party' && message.member.roles.cache.has('754721192413495337') && command[2] != 'save') {
            const embed = new Discord.MessageEmbed();

            if (command[2] == undefined) {
                message.channel.send(Error("Please specify some players to add to the party"));
                return;
            }

            command = command.splice(2);
            for (var i = 0; i < command.length; i++) {

                if (command[i][0].toString() == '<' && command[i][1].toString() == '@') {
                    command[i] = ParcePingtoUserID(command[i].toString());
                }

                if (command[i][0] == '@') {
                    message.channel.send(Error("looks like you entered a player that isn't highlighted with blue"));
                    return;
                }

                con.query("SELECT * FROM Player_data WHERE PlayerID = " + command[i], function (err, result) {
                    result = JSON.parse(JSON.stringify(result));

                    if (result[0] == undefined) {
                        message.channel.send(Error("looks like you entered a player that isn't logged or isn't highlighted with blue"));
                        return;
                    }

                    embed.addField("**" + result[0].Player_name + "**", "has Entered the Party", true);
                    // log player data;
                    user = client.users.cache.find(user => user.id === result[0].PlayerID);
                    var data = [result[0].PlayerID, result[0].Player_name, result[0].Health, result[0].Mana, result[0].Type, result[0].Species, result[0].Attack, result[0].Magic, result[0].Magic_class, result[0].Defense, result[0].Speed, result[0].Luck, result[0].Item1, result[0].Item2, result[0].Item3, result[0].Item4, result[0].Item5, result[0].Bars, result[0].Armour, user.displayAvatarURL({
                        format: 'jpg'
                    })];

                    for (var i = 0; i < data.length; i++) {
                        fs.appendFileSync('./Player_data.txt', data[i] + " ");
                    }
                    fs.appendFileSync('./Player_data.txt', "\n");
                });

            }

            con.query("SELECT * FROM player_data", function (err, result) {
                message.channel.send(embed);
            });

            Active_Party = true;
            console.log(getData());
        }

        if (command[1] === "roll") {
            if (command[2] == undefined) {
                message.channel.send(random(6));
            } else {
                message.channel.send(random(command[2]));
            }
        }

        if (command[1] == 'party' && command[2] == 'save') {
            if (IsActive_Party() == false) {
                message.channel.send(Error("there isn't any active party"));
                return;
            }

            if (!message.member.roles.cache.has('754721192413495337')) {
                message.channel.send(Error("you cannot save the game as a player or server member"));
                return;
            }

            partySave();

            const embed6 = new Discord.MessageEmbed();
            embed6.setDescription("**Party Data Saved**");
            message.channel.send(embed6);
        }
    }

    // character gen ----------------------------------------------------------------------
    if (command[0] === "chargen") {

        types = ['Swordsman', 'Paliden', 'Archer', 'Sorcerer', 'Warlock', 'Theif', 'Healer', 'Barbarian', 'Bard', 'Assassin'];
        Species = ['Human', 'Monster', 'Skeleton', 'Lurker', 'Echo', 'Elf', 'Dark_Elf', 'Golem', 'Goblin', 'Dwarf', 'Dragonborn'];
        Magic_class = ['Fire', 'Water', 'Nature', 'Lightning', 'Ice', 'Earth', 'Wind', 'Space', 'None'];
        Items = ['none', 'none', 'none', 'none', 'none'];
        armour = 'none';
        Bars = 0;

        // check start ----
        if (command[1] == undefined) {
            const embeded = new Discord.MessageEmbed();
            message.channel.send(embeded
                .setTitle("How to Generate a Character")
                .setAuthor("CharGen [Player Name] [player type] [player Species] [player Magic Class] [Attack] [Magic] [Defense] [Speed] [Luck]")
                .addField("**types:** ", DisplayMode(types), true)
                .addField(" **Species:** ", DisplayMode(Species), true)
                .addField(" **Magic_class:** ", DisplayMode(Magic_class), true)
                .setDescription('**Make sure all your stats add up to 15 or lower. you stats will change detmined on your Type Species and your Items** ')
                .setColor('#F50000'));
            return;
        }


        if (command[2] != undefined) {
            command[2] = command[2][0].toUpperCase() + command[2].slice(1);

        } else {
            message.channel.send(Error("Error: please choose a Type " + types));
            return 0;
        }

        if (EqualToList(types, command[2]) == false) {
            message.channel.send("please choose one of the following for your type " + types);
            return 0;
        }


        if (command[3] != undefined) {

            command[3] = command[3][0].toUpperCase() + command[3].slice(1);

        } else {
            message.channel.send(Error("Error: please choose a Species " + Species));
            return 0;
        }

        if (EqualToList(Species, command[3]) == false) {
            message.channel.send("please choose one of the following for your Species " + Species);
        }


        if (command[4] != undefined) {
            command[4] = command[4][0].toUpperCase() + command[4].slice(1);

        } else {
            message.channel.send(Error("Error: please choose a Magic Class " + Magic_class));
            return 0;
        }

        if (EqualToList(Magic_class, command[4]) == false) {
            message.channel.send("please choose one of the following for your Magic Class " + Magic_class);
            return 0;
        }

        // check finished ----
        sum = 0;
        var e = 0;
        for (var i = 5; i <= 9; i++) {
            if (command[i] == undefined) {
                message.channel.send(Error('**looks likes you didn\'t specify enough numbers**'));
                return;
            }

            if (isNaN(command[i])) { // check if the string is a number
                message.channel.send(Error("**command parsing error: please specify a proper number**"));
                return;
            } else {
                command[i] = parseInt(command[i], 10);
            }

            Temp[e] = command[i];
            sum += command[i];
            e++;
        }

        if (sum > 15 || sum < 0) {
            message.channel.send(Error('Error: it looks like that you have entered a number of bars that exceeded 15 or you didn\'t add anything at all '));
            return;
        }

        bars = 15 - sum;

        Temp[0] = Temp[0] * 5 // Attack
        Temp[1] = Temp[1] * 2 // Magic
        Temp[2] = Temp[2] * 3 // Defense
        Temp[3] = Temp[3] * 2 // Speed
        Temp[4] = Temp[4] * 2 // Luck


        // Temp[0] = Attack, Temp[1] = Magic, Temp[2] = Defense, Temp[3] = Speed, Temp[4] = Luck;

        // types -----------
        switch (command[2]) {

            case 'Swordsman':
                // +15 Attack / Sword, Knife, Axe 
                Temp[0] = Temp[0] + 15;

                Items[NextItem(Items)] = 'Wooden sword';
                Items[NextItem(Items)] = 'Wooden knife';
                Items[NextItem(Items)] = 'Wooden axe';


                Temp[1] = Temp[1] / 2;
                bars = bars + Temp[1]
                Temp[1] = 0;
                command[4] = 'None';

                break;
            case 'Paliden':
                // +12 Defence, -3 Speed / Axe, Spear, Bow 

                Temp[2] = Temp[2] + 12;
                Temp[3] = Temp[3] - 3;

                Items[NextItem(Items)] = 'Wooden axe';
                Items[NextItem(Items)] = 'Wooden Spear';
                Items[NextItem(Items)] = 'Wooden Bow';

                Temp[1] = Temp[1] / 2;
                bars = bars + Temp[1]
                Temp[1] = 0;
                command[4] = 'None';

                break;
            case 'Archer':
                // +6 Range, +4 Speed, -6 Defense / Bow, Knife

                Temp[3] = Temp[3] + 4
                Temp[2] = Temp[2] - 6

                Items[NextItem(Items)] = 'Wooden knife';
                Items[NextItem(Items)] = 'Wooden Bow';

                Temp[1] = Temp[1] / 2;
                bars = bars + Temp[1]
                Temp[1] = 0;
                command[4] = 'None';

                break;
            case 'Sorcerer':
                // +6 Magic, +4 Speed / Staff

                Temp[1] = Temp[1] + 6;
                Temp[3] = Temp[3] + 4

                Items[NextItem(Items)] = 'Wooden staff';

                break;
            case 'Warlock':
                // +2 Magic, +10 Attack / Staff, Sword, Knife

                Temp[1] = Temp[1] + 2;
                Temp[0] = Temp[0] + 10;

                Items[NextItem(Items)] = 'Wooden staff';
                Items[NextItem(Items)] = 'Wooden sword';
                Items[NextItem(Items)] = 'Wooden knife';

                break;
            case 'Theif':
                //+5 Attack, +4 Speed, +4 Luck / Knife, Sword 

                Temp[0] = Temp[0] + 5;
                Temp[3] = Temp[3] + 4;
                Temp[4] = Temp[4] + 4;

                Items[NextItem(Items)] = 'Wooden sword';
                Items[NextItem(Items)] = 'Wooden knife';

                Temp[1] = Temp[1] / 2;
                bars = bars + Temp[1]
                Temp[1] = 0;
                command[4] = 'None';

                break;
            case 'Healer':
                // Healing magic, +3 Magic / Staff

                command[4] = 'Healing';
                Temp[1] = Temp[1] + 3;

                Items[NextItem(Items)] = 'Wooden staff';

                break;
            case 'Barbarian':
                //  +10 Attack, +4 Speed / Sword, Axe

                Temp[0] = Temp[0] + 10;
                Temp[3] = Temp[3] + 4;

                Items[NextItem(Items)] = 'Wooden sword';
                Items[NextItem(Items)] = 'Wooden axe';

                Temp[1] = Temp[1] / 2;
                bars = bars + Temp[1]
                Temp[1] = 0;
                command[4] = 'None';

                break;
            case 'Bard':
                // +5 Attack, +6 Magic, -2 Luck / Staff, Spear 

                Temp[0] = Temp[0] + 5;
                Temp[1] = Temp[1] + 6;
                Temp[4] = Temp[4] - 2;

                Items[NextItem(Items)] = 'Wooden staff';
                Items[NextItem(Items)] = 'Wooden Spear';

                Temp[1] = Temp[1] / 2;
                bars = bars + Temp[1]
                Temp[1] = 0;
                command[4] = 'None';

                break;
            case 'Assassin':
                //  +10 Attack, +6 Luck / Sword, Spear, Bow

                Temp[0] = Temp[0] + 10;
                Temp[4] = Temp[4] + 6;

                Items[NextItem(Items)] = 'Wooden sword';
                Items[NextItem(Items)] = 'Wooden Spear';
                Items[NextItem(Items)] = 'Wooden Bow';

                Temp[1] = Temp[1] / 2;
                bars = bars + Temp[1]
                Temp[1] = 0;
                command[4] = 'None';

                break;
        }
        // types ----------- end

        // Species ----------- 
        switch (command[3]) {
            case 'Human':
                break;
            case 'Monster':
                // +2 Magic
                Temp[1] = Temp[1] + 2;
                break;
            case 'Skeleton':
                break;
            case 'Lurker':
                // +10 Attack
                Temp[0] = Temp[0] + 10;
                break;
            case 'Echo':
                // +2 Luck
                Temp[4] = Temp[4] + 2;
                break;
            case 'Elf':
                // +2 Speed 
                Temp[3] = Temp[3] + 2;
                break;
            case 'Dark_elf':
                // +2 Magic, -1 Luck

                Temp[1] = Temp[1] + 2;
                Temp[4] = Temp[4] - 1;

                break;
            case 'Golem':
                //  +3 Defense

                Temp[2] = Temp[2] + 3;

                break;
            case 'Goblin':
                // +2 Luck
                Temp[4] = Temp[4] + 2;
                break;
            case 'Dwarf':
                break;
            case 'Dragonborn':
                // +2 Magic
                Temp[1] = Temp[1] + 2
                break;
        }

        // Species ----------- end

        command[1] = command[1][0].toUpperCase() + command[1].slice(1);

        var sql = "INSERT INTO player_data VALUES (" + message.author.id + ", '" + command[1] + "', 100, 100, '" + command[2] + "', '" + command[3] + "' , " + Temp[0] + "," + Temp[1] + ", '" + command[4] + "' , " + Temp[2] + ", " + Temp[3] + ", " + Temp[4] + ", '" + Items[0] + "', '" + Items[1] + "', '" + Items[2] + "', '" + Items[3] + "', '" + Items[4] + "', " + bars + ", '" + armour + "' ,'" + message.author.avatarURL() + "')";
        con.query(sql, function (err, result) {
            if (err) throw err;
            message.reply("it looks like your Character Generation request was successful \n check by using the command player stats @" + message.author.username);
        });

        itemRefresh(message.author.id);

    }

    // character gen ----------------------------------------------------------------------

    // View Player stats ----------------------------------------------------------------------
    if (command[0] === "player") {
        if (command[1] == undefined) {
            message.channel.send("Error: Invaild Argument : please specify a player(Game Master) or stats");
        }

        if (message.member.roles.cache.has('754721192413495337') && command[1] != "stats") {
            if (command[2] != 'add' && command[2] != 'sub') {
                command[1] = command[1] + " " + command[2];
                command.splice(2, 1);
            }

            if (command[2] == undefined) {
                message.channel.send("please use 'add' or 'sub' for your 2nd argument");
                return;
            }


            if (command[2] === "add") {
                if (command[3] == undefined) {
                    message.channel.send("please use a number for your third argument");
                    return;
                }

                if (isNaN(command[3])) { // check if the string is a number
                    message.channel.send("command parsing error: please specify a proper number");
                    return;
                } else {
                    command[3] = parseInt(command[3], 10);
                }

                if (command[4].toLowerCase() != "to") {
                    message.channel.send("please add 'to' and then specify a person");
                }

                const sets = ["Attack", "Magic", "Defense", "Speed", "Luck", "Health", "Mana", "Bars"];
                command[5] = command[5][0].toUpperCase() + command[5].slice(1);

                for (var i = 0; i < sets.length; i++) {
                    if (sets[i] == command[5]) {
                        break;
                    }

                    if (i == 8) {
                        message.channel.send(Error("looks like you specifyed an invaild attrabute please choose one " + DisplayMode(sets) + " with caps"));
                        return;
                    }

                }



                if (command[1][0].toString() == '<' && command[1][1].toString() == '@') {
                    command[1] = ParcePingtoUserID(command[1].toString())

                }

                con.query("SELECT " + command[5] + " FROM player_data WHERE PlayerID = " + command[1], function (rows, result) {

                    if (result[0] == undefined) {
                        message.channel.send(Error("looks likes what you have specifyed is invaild all vaild checks have been exacuted please check if the player exists"));
                        return;
                    }

                    result = JSON.parse(JSON.stringify(result));
                    command[3] = eval('result[0].' + command[5]) + command[3];


                    con.query("UPDATE player_data SET " + command[5] + " = " + command[3] + " WHERE PlayerID = " + command[1], function (err, result) {
                        if (result == undefined) {
                            message.channel.send("uh oh looks like there was an Fatal error; Please report this bug");
                            return;
                        }

                        con.query("SELECT Player_name FROM player_data Where PlayerID = " + command[1], function (err, result) {
                            const embed = new Discord.MessageEmbed();
                            embed.setDescription(result[0].Player_name + "'s " + command[5] + ": " + command[3])
                            message.channel.send(embed);
                        })

                    });

                });




            } else if (command[2] === "sub") {
                if (command[3] == undefined) {
                    message.channel.send("please use a number for your third argument");
                    return;
                }



                if (isNaN(command[3])) { // check if the string is a number
                    message.channel.send("command parsing error: please specify a proper number");
                    return;
                } else {
                    command[3] = parseInt(command[3], 10);
                }

                if (command[4].toLowerCase() != "from") {
                    message.channel.send("please add 'from' and then specify a person");
                }

                const sets = ["attack", "magic", "defense", "speed", "luck", "health", "mana", "bars"];

                for (var i = 0; i <= 7; i++) {
                    if (sets[i] === command[5]) {
                        break;
                    }

                    if (i == 8) {
                        message.channel.send("uh oh looks like you specifyed an invaild attrabute please choose one " + sets + " with caps");
                        return;
                    }

                }

                command[5] = command[5][0].toUpperCase() + command[5].slice(1);


                if (command[1][0].toString() == '<' && command[1][1].toString() == '@') {
                    command[1] = ParcePingtoUserID(command[1].toString())

                }

                con.query("SELECT " + command[5] + " FROM player_data WHERE PlayerID = " + command[1], function (rows, result) {

                    if (result[0] == undefined) {
                        message.channel.send(Error("looks likes what you have specifyed is invaild all vaild checks have been exacuted please report if this problem continues"));
                        return;
                    }

                    result = JSON.parse(JSON.stringify(result));
                    command[3] = eval('result[0].' + command[5]) - command[3];

                    con.query("UPDATE player_data SET " + command[5] + " = " + command[3] + " WHERE PlayerID = " + command[1], function (err, result) {
                        if (result == undefined) {
                            message.channel.send(Error("looks like there was an Fatal error; Please report this bug"));
                            return;
                        }

                        con.query("SELECT Player_name FROM player_data Where PlayerID = " + command[1], function (err, result) {
                            const embed = new Discord.MessageEmbed();
                            embed.setDescription(result[0].Player_name + "'s " + command[5] + ": " + command[3])
                            message.channel.send(embed);
                        })


                    });
                });
            }
        }

        if (command[1] === "stats") {
            if (command[2] == undefined) {
                command[2] = message.author.username;
            }


            if (command[2][0].toString() == '<' && command[2][1].toString() == '@') {
                command[2] = ParcePingtoUserID(command[2].toString())

            }

            con.query("SELECT * FROM player_data WHERE PlayerID = '" + command[2] + "'", function (err, result) {

                if (err) {
                    message.channel.send("uh oh i think there was an error?");
                    return;
                }

                if (result[0] == undefined) {
                    message.channel.send(Error("**sorry that isn't a vaild user check if the person has been logged by the database host?**"));
                    return;
                }

                var inv = [result[0].Item1, result[0].Item2, result[0].Item3, result[0].Item4, result[0].Item5]

                const embed = new Discord.MessageEmbed();
                embed.setTitle(result[0].Player_name)
                    .setAuthor('Player Stats')
                    .setDescription(
                        "Health: **" + result[0].Health + "**\n" +
                        "Mana: **" + result[0].Mana + "**\n" +
                        "Type: **" + result[0].Type + "**\n" +
                        "Species: **" + result[0].Species + "**\n" +
                        "Attack: **" + result[0].Attack + "**\n" +
                        "Magic: **" + result[0].Magic + "**\n" +
                        "Magic Class: **" + result[0].Magic_class + "**\n" +
                        "Defense: **" + result[0].Defense + "**\n" +
                        "Speed: **" + result[0].Speed + "**\n" +
                        "Luck: **" + result[0].Luck + "** \n" +
                        "Bars: **" + result[0].Bars + "**\n" +
                        "profile(s): **" + result.length + "**").
                addField("Inventory:", "**" + DisplayMode(inv) + "**", true).
                setThumbnail(client.users.cache.find(user => user.id === result[0].PlayerID).displayAvatarURL()).
                setColor('#F00000');

                message.channel.send(embed);


            });
        }
    }
    // View Player stats ----------------------------------------------------------------------
});
// when message is sent ----------------------------------------------------------------------

client.login('');
const Discord = require('discord.js')
const {
    CaptchaGenerator
} = require('captcha-canvas')

const client = new Discord.Client()
const prefix = '!'
const colors = require('./colors.json')


client.on('ready', () => {
    console.log(`${client.user.tag} is online!`)
    client.user.setActivity('Volrize CaptchaBot', {
        type: 'WATCHING'
    })
})


client.on('message', async message => {

    function generateCaptcha() {
        var length = 6,
            charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890",
            retVal = "";
        for (var i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    }

    const genCaptcha = generateCaptcha()

    const captcha = new CaptchaGenerator()
        .setDimension(150, 450)
        .setCaptcha({
            text: genCaptcha,
            size: 60,
            color: "deeppink"
        })
        .setDecoy({
            opacity: 1
        })
        .setTrace({
            color: "deeppink"
        })
    const buffer = captcha.generateSync()

    if ( /*(message.channel.id !== message.guild.channels.cache.find(c => c.name.includes("verify"))) && */ !message.content.startsWith(prefix)) return
    if (message.author.bot) return
    if (message.channel.type === "dm") return


    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const newCaptcha = new Discord.MessageAttachment(buffer, 'captcha.png')

    if ( /*message.channel.id === message.guild.channels.cache.find(c => c.name.includes('verify')) && */ command === "verify") {


        message.channel.send({
            files: [newCaptcha],
            embed: {
                title: `${message.guild.name} Sunucusuna Hoşgeldin!`,
                description: `Lütfen captcha kodunu buraya yazınız.
 
Merhaba! Sunucuya girmeden önce doğrulamayı tamamlamanız gerekmektedir..
**NOT:** **Bu Büyük/Küçük Harfe Duyarlıdır.**
                            
**Neden?**
Sunucuyu korumak için yapılmıştır.
Sunuya token/bot saldırılarından korumak için.
                
**Doğrulaman:**`,
                image: {
                    url: 'attachment://captcha.png'
                },
                color: "RANDOM"
            }
        }).then(() => {
            const filter = m => message.author.id === m.author.id;

            message.channel.awaitMessages(filter, {
                    time: 5 * 60000,
                    max: 1,
                    errors: ['time']
                })
                .then(async messages => {
                    if (messages.first().content === genCaptcha) {
                        message.channel.bulkDelete(3)
                        let verificationEmbed = new Discord.MessageEmbed()
                            .setAuthor(message.author.username, message.author.avatarURL({
                                dynamic: true
                            }))
                            .setColor(colors.green)
                            .setDescription(`Artık ${message.guild.name} sunucusuna giriş yapabilirsin`)
                            .setFooter(message.client.user.username, message.client.user.avatarURL())
							message.member.roles.add("rolid")
                        /*const role = message.guild.roles.cache.find(role => role.name === "Member");
                        message.member.roles.add(role);
                        */
                        await message.channel.send(verificationEmbed).then(m => m.delete({
                            timeout: 3000
                        }))
                        console.log(`${message.author.tag} Doğrulandı!`)
                    }

                })
                .catch(async () => {
                    message.member.kick().catch(error => {
                        console.log(`Sorun oluştu:  ${error}`)
                    })
                    message.channel.bulkDelete(2)
                    message.channel.createInvite({
                        maxAge: 0,
                        maxUses: 1
                    }).then(async invite => {
                        let retryEmbed = new Discord.MessageEmbed()
                        .setAuthor(message.author.username, message.author.avatarURL())
                        .setThumbnail(message.guild.iconURL({
                            dynamic: true
                        }))
                        .setTitle("Doğrulamanız başarısız oldu")
                        .setColor(colors.red)
                        .setDescription(`${message.guild.name} sunucusunda doğrulanmadını lütfen tekrar deneyiniz. Sunucudan çıkın ve [buraya](${invite}) basınız.`)
                        .setFooter(message.client.user.username, message.client.user.avatarURL())
                        await message.author.send(retryEmbed)

                    })
                    
                });
        });
    }

})



client.login('process.env.token')

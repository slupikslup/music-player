const jwt             = require('jsonwebtoken')
const SECRET          = "wqasdfxcdfgb"
const { buildSchema } = require('graphql');

module.exports = () => {
    const Sequelize       = require('sequelize');
    const sequelize       = new Sequelize("work", "root", "1234", {
        dialect: "mysql",
        host: "localhost",
        port: "3100"
      });
const Op = Sequelize.Op
      class Img extends Sequelize.Model { 
    }
    Img.init({
    filename: Sequelize.STRING   
    }, { sequelize, modelName: 'img' })
    
        class Media extends Sequelize.Model {
        }
        
        Media.init({
            artist: Sequelize.STRING,
            album: Sequelize.STRING,
            title: Sequelize.STRING,
            filename: Sequelize.STRING
        }, { sequelize, modelName: 'media' })
        
        
        class User extends Sequelize.Model {
        }
        
        User.init({
          username: Sequelize.STRING,
          password: Sequelize.STRING
        }, { sequelize, modelName: 'user' });
        
        
        User.belongsToMany(Media, {through: "user2media"})
        Media.belongsToMany(User, {through: "user2media"} )
      
    
        
        class Tag extends Sequelize.Model {}
        Tag.init({
            text: Sequelize.STRING
        },{ sequelize, modelName: 'tag' })
        
        Media.belongsToMany(Tag, {through: 'media2tag'})
        Tag.belongsToMany(Media, {through: 'media2tag'})
    
        class Playlist extends Sequelize.Model {
        }
        Playlist.init ({
            title: Sequelize.STRING,
        }, {sequelize, modelName: 'playlist'})
       
        Playlist.belongsToMany(Media, {through: 'playlist2media'})
        Media.belongsToMany(Playlist , {through: 'playlist2media'})
        User.hasMany(Playlist, {as: 'playlist'})
        Playlist.belongsTo(User , {as: 'owner'})
        User.hasOne(Img, {as: 'avatar'})
        Img.belongsTo(User,{as: 'owner'})
        sequelize.sync()
    const anonSchema = buildSchema(`
    type Mutation {
        createUser(user: UserInput): User
    }
    type Query {
        login(username: String!, password:String!) : String
        getAllMedia: [Media]
        getUserAvatar(id: String!): Img
        search(text: String): [Media]
    }
    type User {
        id : Int,
        username: String,
        birthday: String
        age: Float,
        avatar: Img
    }
    input UserInput {
        username: String,
        birthday: String
        password: String
    }
    type Img {
        id: Int, 
        filename: String,
        owner: User
    }
    input ImgInput {
        id: Int,
        owner: UserInput
    }
    type Media {
        filename: String,
        title: String,
        artist: String
        id: Int,
    }
    input MediaInput {
        id: Int
    }
    `)

    const anonRoots = {
       async createUser({user}){ 
        const userAlreadyExists = await User.findOne({where: {username: user.username}})
        if (userAlreadyExists) {
            return null
        }else {
        const user1 = await User.create(user)
        await user1.createAvatar({filename: 'defolt.png'})
        await user1.createPlaylist({title: 'favorites'})
        return user1
        }
    },
        async login({username, password}){
            const user = await User.findOne({where: {username, password}})
            console.log(user)
            if(!user) return null
            return jwt.sign({sub: user.id, username, birthday: user.birthday}, SECRET)
        },
        async getAllMedia() {
            const res =  await Media.findAll({limit: 19})
             return res
         },
         async getUserAvatar({id}){
            var img = Img.findOne({where: {avatarId: id}})
            return img
      },
      async search({text}) {
        var search  = await Media.findAll({where: {
            [Op.or]: [{artist: {
        [Op.like]: "%" + text + "%"
        }}   , {title: {
            [Op.like]: "%" + text + "%"
            }                                 
           }]                              
       }})
      return search
       }
    }
 
        return {anonRoots, anonSchema}
}
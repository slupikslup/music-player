module.exports = () => {
    const Sequelize       = require('sequelize');
    const sequelize       = new Sequelize("work", "root", "1234", {
    dialect: "mysql",
    host: "localhost",
    port: "3100"
  });
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
    return {User, Media, Tag, Playlist, Img}   
}
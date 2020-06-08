const multer = require("multer");
const path = require("path");
const storageImg = multer.diskStorage({
  destination: "./public/uploads/img/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
const storageMedia = multer.diskStorage({
  destination: "./public/uploads/audio/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});


const upload = multer({ storage: storageImg }).single("myImg");
const uploadmedia = multer({ storage: storageMedia }).single("media");
const NodeID3 = require("node-id3");
const express_graphql = require("express-graphql");
const { buildSchema } = require("graphql");
const jwtCheck = require("./jwtCheck");
const jwt = require("jsonwebtoken");
const SECRET = "wqasdfxcdfgb";
const Nodeid3 = require("node-id3");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const anon = require("./ifAnon");
const { anonSchema, anonRoots } = anon();
const fs = require("fs");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const sequelize = new Sequelize("work", "root", "1234", {
  dialect: "mysql",
  host: "localhost",
  port: "3100",
});
const { User, Img, Media, Tag, Playlist } = require("./models")(Sequelize);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
console.log(User.prototype);

async function fileDataMedia(fileData, auth) {
  const user = await User.findByPk(auth.sub);
  if (user) {
    const media = {};
    const id3 = await NodeID3.read(
      `./public/uploads/audio/${fileData.filename}`
    );
    console.log(id3)
    if (id3) {
      media.artist = id3.artist;
      media.album = id3.album;
      media.title = id3.title;
      media.filename = fileData.filename;
      console.log(media);
      await user.addMedium(await Media.create(media));
    }
  }
} 



async function fileDataPhoto(fileData, auth) {
  const user = await User.findByPk(auth.sub);
  // const img = await Img.findOne({where: {avatarId: auth.sub}})
  // if(img.filename !== 'defolt.png'){
  //   fs.unlink(`./public/uploads/img/${img.filename}`)
  // }
  await Img.destroy({where: {avatarId: auth.sub}})
  await user.createAvatar({ filename: fileData.filename });
}

const schema = buildSchema(`
    type Mutation {
        createUser(user: UserInput): User
        updateUser(user: UserInput): User
        createPlaylist(playlist: PlaylistInput):Playlist
        deletePlaylsit(playlist: PlaylistInput): User
        addToMedia(media: ID) : String
        deleteFromPlaylist(playlistId: String, trackId: String): String
        deleteFromMedia(mediaId: String): String
    }
    type Query {
        login(username: String!, password: String!): String
        getUserAvatar(id: String!): Img
        getAllMedia: [Media]
        search(text: String): [Media]
        getPlaylists(id: String): [Playlist]
        getUserMedia(id: String): [Media]
        getTracksFromPlaylist(id: String): [Media]
        addToPlaylist(playlistId: String, trackId: String): String
        isitInPlaylist(playlistId: String, trackId: String): Boolean
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
        filename: String
        id: Int,
        title: String,
        artist: String,
        playlists: [Playlist]
        tags : [String]
    }
    input MediaInput {
        id: Int
        playlists: [PlaylistInput]
        tags: [String]
    }
    type Playlist {
        id: ID,
        title: String,
        tracks: [Media]
    }
    input PlaylistInput {
        id: ID,
        title: String,
        tracks: [MediaInput]
    }
`);

var root = {
  async createUser({ user }) {
    const userAlreadyExists = await User.findOne({
      where: { username: user.username },
    });
    if (userAlreadyExists) {
      return null;
    } else {
      await User.create(user);
      await User.createPlaylist({ title: "favorites" });
      const user = await User.findOne({ where: { username: user.username } });
      await user.createAvatar({ filename: "defolt.png" });
      return user;
    }
  },

  async createPlaylist({ playlist }, { thisUser }) {
    await thisUser.createPlaylist(playlist);
    return await Playlist.findOne({where: {userId: thisUser.id , title: playlist.title}})
  },
  async updateUser({ user }, { thisUser }) {
    if (thisUser) {
      thisUser.username = user.username;
      thisUser.password = user.password;
      return await thisUser.save();
    }
    return null;
  },

  async login({ username, password }) {
    const user = await User.findOne({
      where: { username: username, password: password },
    });
    if (!user) return null;
    return jwt.sign({ sub: user.id, username }, SECRET);
  },
  async getUserAvatar({ id }) {
    var img = Img.findOne({ where: { avatarId: id } });
    return img;
  },
  async getAllMedia() {
    const res = await Media.findAll({ limit: 19 });
    return res;
  },
  async search({ text }) {
    var search = await Media.findAll({
      where: {
        [Op.or]: [
          {
            artist: {
              [Op.like]: "%" + text + "%",
            },
          },
          {
            title: {
              [Op.like]: "%" + text + "%",
            },
          },
        ],
      },
    });
    return search;
  },
  async getPlaylists({ id }, { thisUser }) {
    var playlists = await Playlist.findAll({ where: { userId: id } });
    console.log(playlists);
    return playlists;
  },
  async addToMedia({ media }, { thisUser }) {
    console.log(media);
    var media = await Media.findOne({ where: { id: media } });
    await thisUser.addMedia(media);
    return "added";
  },
  async getUserMedia({ id }, { thisUser }) {
    const user = await User.findOne({ where: { id: id } });
    var media = await user.getMedia({ where: {} });
    return media;
  },
  async getTracksFromPlaylist({id}, {thisUser}){
      const playlist = await Playlist.findOne({where: {id: id , userId: thisUser.id}})
      const media = await playlist.getMedia()
      return media
  },
  async addToPlaylist({playlistId, trackId},{thisUser} ){
      const playlist = await Playlist.findOne({where: {id: playlistId}})
      await  playlist.addMedia(await Media.findOne({where: {id: trackId}}))
      return 'all ok'
  },
  async deleteFromPlaylist({playlistId, trackId}, {thisUser}){
    const playlist = await Playlist.findOne({where: {id: playlistId}})
    await  playlist.removeMedia(await Media.findOne({where: {id: trackId}}))
    return 'all ok'
  },
  async isitInPlaylist({playlistId, trackId}, {thisUser}){
    const playlist = await Playlist.findOne({where: {id: playlistId}})
    const boolean = await playlist.hasMedium(await Media.findOne({where: {id: trackId}}))
    return boolean
  },
  async  deleteFromMedia({mediaId}, {thisUser}){
    await thisUser.removeMedium(await Media.findOne({where: {id: mediaId}}))
    return 'deleted'
  }
};
console.log(Playlist.prototype)

app.get("/download/:song", (req, res) => {
  res.download(__dirname + `/public/uploads/audio/${req.params.song}`);
});
app.post("/upload", async (req, res) => {
  const auth = await jwtCheck(req, SECRET);
  if (auth) {
    upload(req, res, (err) => {
      if (err) {
        console.log(err);
        res.status(404);
      } else {
        fileDataPhoto(req.file, auth);
        res.end("<h1>all ok</h1>");
      }
    });
  } else {
    res.end("<h1>pls login</h1>");
  }
});

app.post("/uploadmedia", async (req, res) => {
  const auth = await jwtCheck(req, SECRET);
  if (auth) {
    uploadmedia(req, res, (err) => {
      if (err) {
        console.log(err);
        res.status(404);
      } else {
        fileDataMedia(req.file, auth);
        res.end("<h1>all ok</h1>");
      }
    });
  } else {
    res.end("<h1>pls login</h1>");
  }
});

app.get("/img/:img", (req, res) => {
  res.sendFile(__dirname + `/public/uploads/img/${req.params.img}`);
});
app.get("/song/:song", (req, res) => {
  res.sendFile(__dirname + `/public/uploads/audio/${req.params.song}`);
});

app.use(
  "/graphql",
  express_graphql(async (req, res) => {
    const jwt = await jwtCheck(req, SECRET);
    console.log(jwt);
    if (jwt) {
      const thisUser = await User.findByPk(jwt.sub);
      return {
        schema: schema,
        rootValue: root,
        graphiql: true,
        context: { jwt, thisUser },
      };
    }
    return {
      schema: anonSchema,
      rootValue: anonRoots,
      graphiql: true,
    };
  })
);


app.use(express.static(path.join(__dirname,'public', 'client')));


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public','client', 'index.html'));
});

app.listen(5002);
sequelize.sync();

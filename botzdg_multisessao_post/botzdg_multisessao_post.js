const { MessageMedia } = require("whatsapp-web.js");
const { body, validationResult } = require("express-validator");

const fileUpload = require("express-fileupload");
const port = process.env.PORT || 8000;

const fs = require("fs");

const {
  criarSessao,
  sessions,
  dirQrCode,
  carregarArquivoSessao,
  criarArquivoSessaoSeNaoExistir,
  setarArquivoSessao,
  io,
  app,
  server,
  express,
} = require("./session.js");
if (!fs.existsSync(dirQrCode)) {
  fs.mkdirSync(dirQrCode);
}

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(
  fileUpload({
    debug: false,
  })
);

app.get("/", (req, res) => {
  res.sendFile("index-multiplas-contas.html", {
    root: __dirname,
  });
});

criarArquivoSessaoSeNaoExistir();

const init = function (socket) {
  const savedSessions = carregarArquivoSessao();

  if (savedSessions.length > 0) {
    if (socket) {
      savedSessions.forEach((e, i, arr) => {
        arr[i].ready = false;
      });

      socket.emit("init", savedSessions);
    } else {
      savedSessions.forEach((sess) => {
        criarSessao(sess.id, sess.token);
      });
    }
  }
};

init();

// Socket IO
io.on("connection", function (socket) {
  init(socket);

  socket.on("create-session", function (data) {
    console.log("Sessão criada: " + data.id);
    criarSessao(data.id, data.token);
  });
});

// POST criar
app.post(
  "/criar-sessao",
  [body("id").notEmpty(), body("token").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    }

    const id = req.body.id;
    const token = req.body.token;

    try {
      criarSessao(id, token);
      res.status(200).json({
        status: true,
        message: "BOT-ZDG Sessão criada: " + id + " - Token: " + token,
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        status: false,
        message: "BOT-ZDG Sessão não foi criada",
      });
    }
  }
);

// POST deletar
app.post("/deletar-sessao", [body("id").notEmpty()], async (req, res) => {
  const errors = validationResult(req).formatWith(({ msg }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped(),
    });
  }

  const id = req.body.id;
  const token = req.body.token;
  const client = sessions.find((sess) => sess.id == id)?.client;
  const savedSessions = carregarArquivoSessao();
  const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);
  const tokenN = savedSessions.splice(sessionIndex, 1)[0].token;

  if (tokenN !== token) {
    res.status(422).json({
      status: false,
      message: "BOT-Humberto Token inválido",
    });
    return;
  }

  try {
    client.destroy();
    client.initialize();
    const savedSessions = carregarArquivoSessao();
    const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);
    savedSessions.splice(sessionIndex, 1);
    setarArquivoSessao(savedSessions);
    fs.rmSync(dirQrCode + "/" + id, { recursive: true, force: true });
    res.status(200).json({
      status: true,
      message: "BOT-Humberto Sessão deletada: " + id,
    });
  } catch (e) {
    console.log("© BOT-Humberto");
    res.status(500).json({
      status: false,
      message: "BOT-Humberto Sessão não foi deletada",
    });
  }
});

// POST status
app.post("/status-sessao", [body("id").notEmpty()], async (req, res) => {
  const errors = validationResult(req).formatWith(({ msg }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped(),
    });
  }

  const id = req.body.id;
  const token = req.body.token;
  const client = sessions.find((sess) => sess.id == id)?.client;
  const savedSessions = carregarArquivoSessao();
  const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);
  const tokenN = savedSessions.splice(sessionIndex, 1)[0].token;

  if (tokenN !== token) {
    res.status(422).json({
      status: false,
      message: "BOTHumberto Token inválido",
    });
    return;
  }

  try {
    const status = await client.getState();
    res.status(200).json({
      status: true,
      message: "BOTHumberto status: " + status,
    });
  } catch (e) {
    console.log("© BOTHumberto");
    res.status(500).json({
      status: false,
      message: "BOTHumberto Sessão não foi deletada",
    });
  }
});

// POST send-message
app.post(
  "/send-message",
  [body("user").notEmpty(), body("message").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    }

    const sender = req.body.sender;
    const client = sessions.find((sess) => sess.id == sender)?.client;
    if (!client) {
      return res.status(422).json({
        status: false,
        message: `Sender: ${sender} não foi encontrado!`,
      });
    }

    const token = req.body.token;
    const savedSessions = carregarArquivoSessao();
    const sessionIndex = savedSessions.findIndex((sess) => sess.id == sender);
    const tokenN = savedSessions.splice(sessionIndex, 1)[0].token;

    if (tokenN !== token) {
      res.status(422).json({
        status: false,
        message: "BOTHumberto Token inválido",
      });
      return;
    }

    const user = req.body.user + "@c.us";
    const message = req.body.message;

    client
      .sendMessage(user, message)
      .then((response) => {
        res.status(200).json({
          status: true,
          message: "BOTHumberto Mensagem enviada",
          response: response,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          status: false,
          message: "BOTHumberto Mensagem não enviada",
          response: err.message,
        });
      });
  }
);

// POST send-media URL
app.post("/send-media", async (req, res) => {
  const sender = req.body.sender;
  const client = sessions.find((sess) => sess.id == sender)?.client;
  if (!client) {
    return res.status(422).json({
      status: false,
      message: `Sender: ${sender} não foi encontrado!`,
    });
  }

  const token = req.body.token;
  const savedSessions = carregarArquivoSessao();
  const sessionIndex = savedSessions.findIndex((sess) => sess.id == sender);
  const tokenN = savedSessions.splice(sessionIndex, 1)[0].token;

  if (tokenN !== token) {
    res.status(422).json({
      status: false,
      message: "BOTHumberto Token inválido",
    });
    return;
  }

  const user = req.body.user + "@c.us";
  const caption = req.body.caption;
  const fileUrl = req.body.file;
  const media = await MessageMedia.fromUrl(fileUrl);

  client
    .sendMessage(user, media, { caption: caption })
    .then((response) => {
      res.status(200).json({
        status: true,
        message: "BOTHumberto Mensagem enviada",
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        message: "BOTHumberto Mensagem não enviada",
        response: err.text,
      });
    });
});

// POST send-media PATH
app.post("/send-media2", async (req, res) => {
  const sender = req.body.sender;
  const client = sessions.find((sess) => sess.id == sender)?.client;
  if (!client) {
    return res.status(422).json({
      status: false,
      message: `Sender: ${sender} não foi encontrado!`,
    });
  }

  const token = req.body.token;
  const savedSessions = carregarArquivoSessao();
  const sessionIndex = savedSessions.findIndex((sess) => sess.id == sender);
  const tokenN = savedSessions.splice(sessionIndex, 1)[0].token;

  if (tokenN !== token) {
    res.status(422).json({
      status: false,
      message: "BOTHumberto Token inválido",
    });
    return;
  }

  const user = req.body.user + "@c.us";
  const caption = req.body.caption;
  const filePath = req.body.file;
  const media = MessageMedia.fromFilePath(filePath);

  client
    .sendMessage(user, media, { caption: caption })
    .then((response) => {
      res.status(200).json({
        status: true,
        message: "BOTHumberto Mensagem enviada",
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        message: "BOTHumberto Mensagem não enviada",
        response: err.text,
      });
    });
});

// POST send-media PATH
app.post("/send-media3", async (req, res) => {
  const sender = req.body.sender;
  const client = sessions.find((sess) => sess.id == sender)?.client;
  if (!client) {
    return res.status(422).json({
      status: false,
      message: `Sender: ${sender} não foi encontrado!`,
    });
  }

  const token = req.body.token;
  const savedSessions = carregarArquivoSessao();
  const sessionIndex = savedSessions.findIndex((sess) => sess.id == sender);
  const tokenN = savedSessions.splice(sessionIndex, 1)[0].token;

  if (tokenN !== token) {
    res.status(422).json({
      status: false,
      message: "BOTHumberto Token inválido",
    });
    return;
  }

  const user = req.body.user + "@c.us";
  const fileUrl = req.body.file;
  const media = await MessageMedia.fromUrl(fileUrl);

  client
    .sendMessage(user, media, { sendAudioAsVoice: true })
    .then((response) => {
      res.status(200).json({
        status: true,
        message: "BOTHumberto Mensagem enviada",
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        message: "BOT-ZDG Mensagem não enviada",
        response: err.text,
      });
    });
});

app.post("/image", function (req, res) {
  const sender = req.body.sender;
  const client = sessions.find((sess) => sess.id == sender)?.client;
  if (!client) {
    return res.status(422).json({
      status: false,
      message: `Sender: ${sender} não foi encontrado!`,
    });
  }

  const token = req.body.token;
  const savedSessions = carregarArquivoSessao();
  const sessionIndex = savedSessions.findIndex((sess) => sess.id == sender);
  const tokenN = savedSessions.splice(sessionIndex, 1)[0].token;

  if (tokenN !== token) {
    res.status(422).json({
      status: false,
      message: "BOT-ZDG Token inválido",
    });
    return;
  }

  res.set({ "Content-Type": "image/png" });
  res.sendFile("./qrcode/" + sender + "/qrcode.png", {
    root: __dirname,
  });
});

server.listen(port, function () {
  console.log("Aplicação rodando na porta *: " + port);
});

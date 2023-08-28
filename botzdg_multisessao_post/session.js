const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const fs = require("fs");
const socketIO = require("socket.io");
const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const dirQrCode = "./qrcode";
const sessions = [];
const SESSIONS_FILE = "./whatsapp-sessions.json";

const carregarArquivoSessao = function () {
  return JSON.parse(fs.readFileSync(SESSIONS_FILE));
};

const criarSessao = function (id, token) {
  console.log("Criando sessão: " + id);
  const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
      //executablePath: "/usr/bin/google-chrome",
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process", // <- this one doesn't works in Windows
        "--disable-gpu",
      ],
    },
    authStrategy: new LocalAuth({
      clientId: id,
    }),
  });

  if (!fs.existsSync(dirQrCode + "/" + id)) {
    fs.mkdirSync(dirQrCode + "/" + id);
  }

  client.on("qr", async (qr) => {
    console.log("QRCode recebido", qr);
    const bufferImage = await qrcode.toDataURL(qr);
    var base64Data = bufferImage.replace(/^data:image\/png;base64,/, "");
    try {
      fs.unlinkSync(dirQrCode + "/" + id + "/qrcode.png");
    } catch (e) {
      console.log(e.message);
    } finally {
      fs.writeFileSync(
        dirQrCode + "/" + id + "/qrcode.png",
        base64Data,
        "base64"
      );
    }
    qrcode.toDataURL(qr, (err, url) => {
      io.emit("qr", { id: id, src: url });
      io.emit("message", {
        id: id,
        text: "QRCode recebido, aponte a câmera  seu celular!",
      });
    });
  });

  client.on("ready", async () => {
    io.emit("ready", { id: id });
    console.log("Disposito pronto: " + id);
    io.emit("qr", "./check.svg");
    io.emit("message", { id: id, text: "Dispositivo pronto!" });
    try {
      fs.unlinkSync(dirQrCode + "/" + id + "/qrcode.png");
    } catch (e) {
      console.log(e.message);
    }
    sessions.push({
      id: id,
      token: token,
      client: client,
    });
    const savedSessions = carregarArquivoSessao();
    const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);
    savedSessions[sessionIndex].ready = true;
    setarArquivoSessao(savedSessions);
  });

  client.on("authenticated", () => {
    io.emit("authenticated", { id: id });
    io.emit("qr", "./check.svg");
    io.emit("message", { id: id, text: "Dispositivo autenticado!" });
  });

  client.on("auth_failure", function () {
    io.emit("message", {
      id: id,
      text: "Falha na autenticação, reiniciando...",
    });
  });

  client.on("disconnected", (reason) => {
    io.emit("message", { id: id, text: "Dispositivo desconectado!" });
    client.destroy();
    client.initialize();

    const savedSessions = carregarArquivoSessao();
    const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);
    savedSessions.splice(sessionIndex, 1);
    setarArquivoSessao(savedSessions);

    io.emit("remove-session", id);
  });

  const savedSessions = carregarArquivoSessao();
  const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);

  if (sessionIndex == -1) {
    savedSessions.push({
      id: id,
      token: token,
      ready: false,
    });
    setarArquivoSessao(savedSessions);
  }
  client.initialize();
};
const criarArquivoSessaoSeNaoExistir = function () {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
      console.log("Arquivo criado com sucesso.");
    } catch (err) {
      console.log("Falha ao criar arquivo: ", err);
    }
  }
};

const setarArquivoSessao = function (sessions) {
  fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), function (err) {
    if (err) {
      console.log(err);
    }
  });
};
module.exports = {
  criarSessao,
  sessions,
  SESSIONS_FILE,
  dirQrCode,
  carregarArquivoSessao,
  criarArquivoSessaoSeNaoExistir,
  setarArquivoSessao,
  io,
  app,
  server,
  express,
};

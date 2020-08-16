const fs = require('fs');
const bodyParser = require('body-parser');
const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');

const server = jsonServer.create();
const router = jsonServer.router('./db.json');

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(jsonServer.defaults());

const SECRET_KEY = '123456789';

function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY);
}

function isAuthenticated({ email, password }) {
  return (
    JSON.parse(fs.readFileSync('./users.json', 'UTF-8')).users.findIndex(
      (user) => user.email === email && user.password === password
    ) !== -1
  );
}

server.post('/auth/register', (req, res) => {
  console.log('register endpoint called; request body:');
  console.log(req.body);
  const { email, password, username } = req.body;

  if (isAuthenticated({ email, password }) === true) {
    const status = 401;
    const message = 'Email already exist';
    res.status(status).json({ status, message });
    return;
  }

  fs.readFile('./users.json', (err, data) => {
    if (err) {
      const status = 401;
      const message = err;
      res.status(status).json({ status, message });
      return;
    }

    var data = JSON.parse(data.toString());
    var last_item_id = data.users[data.users.length - 1].id;

    data.users.push({
      id: last_item_id + 1,
      email: email,
      password: password,
      username: username,
    });
    fs.writeFile('./users.json', JSON.stringify(data), (err, result) => {
      if (err) {
        const status = 401;
        const message = err;
        res.status(status).json({ status, message });
        return;
      }
    });
  });

  const access_token = createToken({ email, password });
  console.log('Access Token:' + access_token);
  res.status(200).json({ access_token });
});

server.post('/auth/login', (req, res) => {
  console.log('login endpoint called; request body:');
  console.log(req.body);
  const { email, password } = req.body;
  if (isAuthenticated({ email, password }) === false) {
    const status = 401;
    const message = 'Incorrect email or password';
    res.status(status).json({ status, message });
    return;
  }
  const access_token = createToken({ email, password });
  console.log('Access Token:' + access_token);
  res.status(200).json({ access_token });
});

server.use(router);

server.listen(8000, () => {
  console.log('Run Auth API Server');
});

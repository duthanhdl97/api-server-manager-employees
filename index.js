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
    JSON.parse(fs.readFileSync('./users.json', 'UTF-8')).user.findIndex(
      (user) => user.email === email && user.password === password
    ) !== -1
  );
}

server.post('/auth/register', (req, res) => {
  const { email, phone, lastName, firstName, password } = req.body;

  if (isAuthenticated({ email, password }) === true) {
    const status = 401;
    const message = 'Email đã được đăng ký !';
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
    var last_item_id = data.user[data.user.length - 1].id;

    data.user.push({
      id: last_item_id + 1,
      email: email,
      phone: phone,
      lastName: lastName,
      firstName: firstName,
      password: password,
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
  const accessToken = createToken({ email, password });
  console.log('Access Token:' + accessToken);
  res.status(200).json({ accessToken });
});

server.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (isAuthenticated({ email, password }) === false) {
    const status = 401;
    const message = 'Email hoặc mật khẩu không đúng';
    res.status(status).json({ status, message });
    return;
  }
  const accessToken = createToken({ email, password });
  res.status(200).json({ accessToken });
});

server.use(router);

server.listen(8000, () => {
  console.log('Run Auth API Server');
});

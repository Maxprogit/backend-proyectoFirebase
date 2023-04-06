const express = require('express')
const bcrypt = require('bcrypt')
const { initializeApp } = require('firebase/app')
const cors = require('cors')
const { getFirestore, setDoc, getDoc, collection, doc, getDocs, deleteDoc } = require('firebase/firestore')
require('dotenv/config')    

//Configuracion de firebase
const firebaseConfig = {
  apiKey: "AIzaSyBvpzA-SjgPzFa6N4mZwnphQB-_Xh6uEYg",
  authDomain: "integrador-9aa2a.firebaseapp.com",
  projectId: "integrador-9aa2a",
  storageBucket: "integrador-9aa2a.appspot.com",
  messagingSenderId: "471250525389",
  appId: "1:471250525389:web:9f8c207b3139718bcadd84"
};

  //Inicializar BD de firebase
  const firebase = initializeApp(firebaseConfig)
  const db = getFirestore()


  //Inicializar el servidor
  const app = express()


  const corsOptions = {
    "origin": "*",
    "optionSuccessStatus": 200
  }

  app.use(express.json())
  app.use(cors(corsOptions))

  //Rutas para las peticiones EndPoint | API
  //Ruta para el registro
  app.post('/registro', (req, res) => {
    const { nombre, correo, contra, confirmPass } = req.body;
  
    // Validación de los datos
    if (nombre === '' || !correo || contra === '' ) {
      res.json({
        'alert': 'No rellenaste todos los campos correctamente'
      });
    } else if (contra < 6) {
      res.json({
        'alert': 'La contraseña debe contener al menos 6 caracteres'
      });
    } else if ((confirmPass === '')) {
        res.json({
          'aler': 'Debes confirmar tu contraseña' 
        });
    } else if (confirmPass !== contra) {
      res.json({
        'alert': 'Las contraseñas deben coincidir'
      });
    } else {
      const users = collection(db, 'users');
  
      // Verificar que el correo no exista en la colección
      getDoc(doc(users, correo)).then(user => {
        if (user.exists()) {
          res.json({
            'alert': 'El correo ya existe en la base de datos'
          });
        } else {
          bcrypt.genSalt(10, (err, salt) => {
            if (err) {
              res.json({
                'alert': 'Ha ocurrido un error en el servidor'
              });
            } else {
              bcrypt.hash(contra, salt, (err, hash) => {
                if (err) {
                  res.json({
                    'alert': 'Ha ocurrido un error en el servidor'
                  });
                } else {
                  req.body.password = hash;
  
                  // Guardar en la base de datos
                  setDoc(doc(users, correo), req.body).then(() => {
                    res.json({
                      'alert': 'success'
                    });
                  });
                }
              });
            }
          });
        }
      });
    }
  });
  
        
  app.get('/usuarios', async (req, res) => {
    const colRef  = collection(db, 'users')
    const docsSnap = await getDocs(colRef)
    let data = []
    docsSnap.forEach(doc => {
      data.push(doc.data())
    })
    res.json({
      'alert': 'success',
      data
    })
  })       

  app.post('/login', (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ alert: 'No se han recibido los datos correctamente' });
    }
  
    const usersRef = collection(db, 'users');
    const userDoc = doc(usersRef, email);
  
    getDoc(userDoc)
      .then((doc) => {
        if (!doc.exists()) {
          return res.status(400).json({ alert: 'Correo no registrado en la base de datos' });
        }
  
        const user = doc.data();
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) {
            return res.status(500).json({ alert: 'Ha ocurrido un error en el servidor' });
          }
  
          if (result) {
            const { nombre, email, password: _, ...rest } = user;
            const data = { nombre, email, ...rest };
            return res.json({ alert: 'Success', data });
          } else {
            return res.status(401).json({ alert: 'Contraseña incorrecta' });
          }
        });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ alert: 'Ha ocurrido un error en el servidor' });
      });
  });
  

  ///Ruta borrar
app.post('/delete', (req, res) => {
  let { email } = req.body

  deleteDoc(doc(collection(db, 'users'), email))
    .then((response) => {
      res.json({
        'alert': 'success'
      })
    })
    .catch((error) => {
      res.json({
        'alert': 'No se pudo eliminar el usuario'
      })
    })
})

  app.post('/update', (req, res) => {
    const { email, nombre, } = req.body

    //Validacion de los datos 
    if(nombre.length < 6) {
      res.json({
        'alert': 'nombre requiere minimo 6 caracters'
      })
    }  else { 
      db.collection('users').doc(email) 
      const updateData = {
        nombre, 
        email,
      
      }
      updateDoc(doc(collection(db, 'users'), updateData, email))
      .then((response) => {
        res.json({
          'alert': 'success'
        })
      })
      .catch(() => {
        res.json({
          'alert': error
        })
      })
    }
  })

  



  const PORT = process.env.PORT || 19000

  //Ejecutamos el servidor
  app.listen(PORT, () => {
    console.log(`Escuchando el puerto: ${PORT}`)
  })

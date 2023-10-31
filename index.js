const express=require('express')
const cors =require('cors')
const jwt=require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const port=process.env.PORT||5000
const app=express()
app.use(cookieParser())

//
app.use(cors(
 {
  origin:['http://localhost:5173'],
  credentials:true
 } 
)
//----------------------------recap ---------------------------------
  //cors({
//   origin:['http://localhost:5173'],
//   credentials:true
// })
//----------------------------recap  end---------------------------------
)
app.use(express.json())


app.get("/",(req,res)=>{
    res.send("This is cars doctor plan ")
})
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jvuujup.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

/// create a middle were for myself 
const logger =async(req,res,next)=>{
  console.log('called:',req.host,req.originalUrl)
  next()
}
/// verified token
const verifiedToken = async(req,res,next)=>{
  const token =req.cookies?.token
  if(!token){
  return  res.status(401).send({message:'unauthorized'})
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({message:'This token already used'})
    }
    req.user=decoded 
    next()
  })
}



  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      const serviceCollection=client.db('carDoctor').collection('services')
      const customerCollection=client.db('carDoctor').collection('customer')
//jwt ----------------------------------------------------------------------------------------
  app.post('/jwt',logger, async(req,res)=>{
    const user=req.body 
    //----------------------------------recap-----------------------------------
   // console.log(user)
    //const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn : "1h"})
   // res
    // .cookie('token',token,{
    //   httpOnly:true,
    //   secure:false,
    //  // sameSite:'none'
    //   }
  
    //   )
      // .send({success:true})
      // }
    ///////////////////////---------------2nd time 
    const token =jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
    res
    .cookie('token',token,{
      httpOnly:true,
      secure:false
    }
    )
    .send({success:true})

   })



////services ----------------------------------------------------------------------------
    app.get('/services', logger,async(req,res)=>{
    const cursor =serviceCollection.find()
    const result =await cursor.toArray()
    res.send(result)})
    

  


    app.get('/services/:id',async(req,res)=>{
        const id =req.params.id
        console.log(id)
        const query ={_id:new ObjectId(id)}
        const options = {
        projection: {  title: 1,price: 1,service_id:1,img:1
        },}
        const result =await serviceCollection.findOne(query,options)
        res.send(result)
      //  console.log(result)
    })
////Booking Customer 
app.post('/customer',logger, async(req,res)=>{
    const id=req.body 
    console.log(id)
     const result = await customerCollection.insertOne(id)
     res.send(result)
   })

app.get('/customer',verifiedToken ,async(req,res)=>{
   // console.log('tok tk token',req.cookies.token)
   console.log('valid user for valid token',req.user)
   if(req.query.email !== req.user.email){
    return res.status(403).send({message:'forbidden'})
   }

    let query= {}
    if(req.query?.email){
    query ={email: req.query.email}
            
    }
    const result =await customerCollection.find(query).toArray()
   // console.log(result)
    res.send(result)
   })

app.delete('/customer/:id',async(req,res)=>{
    const id =req.params.id
    console.log(id)
    const query ={_id:new ObjectId(id)}
    const result=await customerCollection.deleteOne(query)
    res.send(result)
})

app.patch('/customer/:id',async(req,res)=>{
    const id =req.params.id
    const query ={_id:new ObjectId(id)}
    //console.log(id)
    const updateBooking=req.body
   console.log(updateBooking.status)
    const update={
        $set:{
            status:updateBooking.status
        }
    }
    const result =await customerCollection.updateOne(query,update)
   // console.log(updateBooking)
    res.send(result)
})

    



      
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
     // await client.close();
    }
  }
  run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

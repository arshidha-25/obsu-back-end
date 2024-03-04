const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();

app.use(express.json());
app.use(cors());

const uri = 'mongodb://localhost:27017'; // Replace with your MongoDB connection URI
const client = new MongoClient(uri, { useNewUrlParser: true });

async function connect() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        return client.db('obsu');
    } catch (err) {
        console.error('Failed to connect to MongoDB: ' + err);
    }
}

app.post('/login', async (req, res) => {
    const db = await connect();
    const collection = db.collection('users');
    const { email, password } = req.body;
    const user = await collection.findOne({ email, password });

    if (user) {
        res.status(200).json({
            status: 0,
            data: user,
        });
    } else {
        res.status(400).json({
            status: 1,
        });
    }
});

app.post('/registration', async (req, res) => {
    const db = await connect();
    const collection = db.collection('users');
    const { firstName, lastName, email, password } = req.body;

    try {
        const result = await collection.insertOne({
            name: `${firstName} ${lastName}`,
            email,
            password,
        });

        if (result.insertedId) {
            res.status(201).json({ status: 0 });
        } else {
            res.status(500).json({ status: 1 });
        }
    } catch (error) {
        res.status(500).json({ status: 1 });
    }
});

app.post('/questions', async (req, res) => {
    const db = await connect();
    const questionsCollection = db.collection('questions');
    const questionData = req.body;
    async function generateCustomId(collection) {
        const count = await collection.countDocuments();
        return count + 1; // Increment the count to create a unique custom _id
    }
    try {
        questionData.is_delete = false;
        questionData.is_active = true;
        questionData.created_at = new Date();
        questionData._id = await generateCustomId(questionsCollection);

        const result = await questionsCollection.insertOne(questionData);

        if (result.insertedId) {
            const questions = await questionsCollection
                .find({ is_delete: false, is_active: true })
                .toArray();
            res.status(201).json(questions);
        } else {
            res.status(500).json({ error: 'Failed to create question' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to create question' });
    }
});

app.get('/questions', async (req, res) => {
    try {
        const db = await connect();
        const questionsCollection = db.collection('questions');
        const questions = await questionsCollection
            .find({ is_delete: false, is_active: true })
            .toArray();
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

app.get('/questions/:id', async (req, res) => {
    const questionId = req.params.id;

    try {
        const db = await connect();
        const questionsCollection = db.collection('questions');
        const question = await questionsCollection.findOne({
            _id: ObjectId(questionId),
            is_delete: false,
            is_active: true,
        });

        if (!question) {
            res.status(404).json({ error: 'Question not found' });
        } else {
            res.status(200).json(question);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch question' });
    }
});

app.put('/questions/:id', async (req, res) => {
    const questionId = req.params.id;
    const questionData = req.body;

    try {
        console.log(questionId)
        const db = await connect();
        const questionsCollection = db.collection('questions');
        const filter = {
            _id: parseInt(questionId),
            is_delete: false,
            is_active: true,
        };

        const update = {
            $set: questionData,
        };

        const options = {
            returnOriginal: false,
        };

        const result = await questionsCollection.findOneAndUpdate(filter, update);
        console.log(result)
        if (!result.value) {
            res.status(404).json({ error: 'Question not found' });
        } else {
            res.status(200).json(result.value);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update question' });
    }
});

app.delete('/questions/:id', async (req, res) => {
    const questionId = req.params.id;

    try {
        const db = await connect();
        const questionsCollection = db.collection('questions');
        const filter = {
            _id: ObjectId(questionId),
            is_delete: false,
            is_active: true,
        };

        const update = {
            $set: {
                is_delete: true,
                is_active: false,
            },
        };

        const result = await questionsCollection.findOneAndUpdate(filter, update);

        if (!result.value) {
            res.status(404).json({ error: 'Question not found' });
        } else {
            const questions = await questionsCollection
                .find({ is_delete: false, is_active: true })
                .toArray();
            res.status(200).json({ message: 'Question deleted successfully', questions });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

app.post('/sections', async (req, res) => {
    const sectionData = req.body;

    try {
        const db = await connect();
        const sectionsCollection = db.collection('sections');
        const result = await sectionsCollection.insertOne(sectionData);

        if (result.insertedId) {
            const sectionsCollection = db.collection('sections');
            const sections = await sectionsCollection.find().toArray();
            res.status(201).json(sections);
        } else {
            res.status(500).json({ error: 'Failed to create section' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to create section' });
    }
});

app.get('/sections', async (req, res) => {
    try {
        const db = await connect();
        const sectionsCollection = db.collection('sections');
        const sections = await sectionsCollection.find().toArray();
        res.status(200).json(sections);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sections' });
    }
});

app.get('/sections/:id', async (req, res) => {
    const sectionId = req.params.id;

    try {
        const db = await connect();
        const sectionsCollection = db.collection('sections');
        const section = await sectionsCollection.findOne({
            _id: sectionId,
        });

        if (!section) {
            res.status(404).json({ error: 'Section not found' });
        } else {
            res.status(200).json(section);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch section' });
    }
});

app.put('/sections/:id', async (req, res) => {
    const sectionId = req.params.id;
    const sectionData = req.body;

    try {
        console.log(sectionId);
        const db = await connect();
        const sectionsCollection = db.collection('sections');
        const filter = {
            _id: parseInt(sectionId),
        };

        const update = {
            $set: sectionData,
        };

        const options = {
            returnOriginal: false,
        };

        const result = await sectionsCollection.findOneAndUpdate(filter, update);

        console.log("========="+result);
        if (!result.value) {
            res.status(404).json({ error: 'Section not found' });
        } else {
            res.status(200).json(result.value);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update section' });
    }
});

app.delete('/sections/:id', async (req, res) => {
    const sectionId = req.params.id;

    try {
        const db = await connect();
        const sectionsCollection = db.collection('sections');
        const filter = {
            _id: ObjectId(sectionId),
        };

        const result = await sectionsCollection.findOneAndDelete(filter);

        if (!result.value) {
            res.status(404).json({ error: 'Section not found' });
        } else {
            res.status(200).json({ message: 'Section deleted successfully' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete section' });
    }
});

app.post('/tests', async (req, res) => {
    const testDetails = req.body;

    try {
        const db = await connect();
        const testsCollection = db.collection('tests');
        const result = await testsCollection.insertOne(testDetails);

        if (result.insertedId) {
            res.status(201).json(result.ops[0]);
        } else {
            res.status(500).json({ error: 'Failed to create test' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to create test' });
    }
});

app.get('/tests', async (req, res) => {
    try {
        const db = await connect();
        const testsCollection = db.collection('tests');
        const tests = await testsCollection.find().toArray();
        res.status(200).json(tests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tests' });
    }
});

app.get('/tests/:id', async (req, res) => {
    const testId = req.params.id;

    try {
        const db = await connect();
        const testsCollection = db.collection('tests');
        const test = await testsCollection.findOne({
            _id: ObjectId(testId),
        });

        if (!test) {
            res.status(404).json({ error: 'Test not found' });
        } else {
            res.status(200).json(test);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch test' });
    }
});

app.get('/attend/:link', (req, res) => {
    const testLink = req.params.link;

    // You can handle the attendance logic here (e.g., authentication and rendering the test panel)
    // For simplicity, let's just return the link
    res.status(200).json({ link: testLink });
});

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});


const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const { Application, MailSystem } = require('./main');

const NAMES = ['Alice', 'Bob', 'Charlie'];

// Helper - 建立 app，people/selected 直接設定好
function makeApp(names = NAMES) {
    const app = new Application();
    app.people = [...names];
    app.selected = [];
    return app;
}

// ===== MailSystem Tests =====

test('MailSystem.write should return correct context', (t) => {
    // 在第一個測試時建立 name_list.txt 讓 constructor 不會噴錯
    fs.writeFileSync('name_list.txt', NAMES.join('\n'));
    const mailSystem = new MailSystem();
    const result = mailSystem.write('Alice');
    assert.strictEqual(result, 'Congrats, Alice!');
});

test('MailSystem.send should return true when Math.random > 0.5', (t) => {
    const mailSystem = new MailSystem();
    const original = Math.random;
    Math.random = () => 0.6;
    const result = mailSystem.send('Alice', 'Congrats, Alice!');
    assert.strictEqual(result, true);
    Math.random = original;
});

test('MailSystem.send should return false when Math.random <= 0.5', (t) => {
    const mailSystem = new MailSystem();
    const original = Math.random;
    Math.random = () => 0.4;
    const result = mailSystem.send('Alice', 'Congrats, Alice!');
    assert.strictEqual(result, false);
    Math.random = original;
});

// ===== Application Tests =====

test('Application.getNames should return people and selected arrays', async (t) => {
    const app = new Application();
    const [people, selected] = await app.getNames();
    assert.ok(Array.isArray(people));
    assert.ok(Array.isArray(selected));
    assert.strictEqual(selected.length, 0);
    assert.deepStrictEqual(people, NAMES);
});

test('Application.getRandomPerson should return a person from people list', (t) => {
    const app = makeApp();
    const original = Math.random;
    Math.random = () => 0;
    const person = app.getRandomPerson();
    assert.strictEqual(person, 'Alice');
    Math.random = original;
});

test('Application.selectNextPerson should return null when all selected', (t) => {
    const app = makeApp();
    app.selected = [...app.people];
    const result = app.selectNextPerson();
    assert.strictEqual(result, null);
});

test('Application.selectNextPerson should return a person and add to selected', (t) => {
    const app = makeApp();
    const original = Math.random;
    Math.random = () => 0;
    const person = app.selectNextPerson();
    assert.strictEqual(person, 'Alice');
    assert.ok(app.selected.includes('Alice'));
    Math.random = original;
});

test('Application.selectNextPerson should skip already selected person', (t) => {
    const app = makeApp(['Alice', 'Bob']);
    app.selected = ['Alice'];
    const original = Math.random;
    let callCount = 0;
    Math.random = () => callCount++ === 0 ? 0 : 0.9;
    const person = app.selectNextPerson();
    assert.strictEqual(person, 'Bob');
    assert.ok(app.selected.includes('Bob'));
    Math.random = original;
});

test('Application.notifySelected should call write and send for each selected', (t) => {
    const app = makeApp();
    app.selected = ['Alice', 'Bob'];

    let writeCalls = [];
    let sendCalls = [];
    app.mailSystem.write = (name) => {
        writeCalls.push(name);
        return 'Congrats, ' + name + '!';
    };
    app.mailSystem.send = (name, context) => {
        sendCalls.push({ name, context });
        return true;
    };

    app.notifySelected();

    assert.deepStrictEqual(writeCalls, ['Alice', 'Bob']);
    assert.strictEqual(sendCalls.length, 2);
    assert.strictEqual(sendCalls[0].name, 'Alice');
    assert.strictEqual(sendCalls[1].name, 'Bob');
});

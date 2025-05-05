import request from 'supertest';
import { app, TICKER } from '../index';

describe('Basic tests', () => {
  it('verify initial balances', async () => {
    let res = await request(app).get('/balance/1').send();
    console.log('Initial balance for user 1:', res.body.balances);
    expect(res.body.balances[TICKER]).toBe(10);

    res = await request(app).get('/balance/2').send();
    console.log('Initial balance for user 2:', res.body.balances);
    expect(res.body.balances[TICKER]).toBe(10);
  });

  it('Can create orders', async () => {
    console.log('Placing bid order');
    await request(app).post('/order').send({
      type: 'limit',
      side: 'bid',
      price: 1400.1,
      quantity: 1,
      userId: '1',
    });

    console.log('Placing ask order for 1400.9');
    await request(app).post('/order').send({
      type: 'limit',
      side: 'ask',
      price: 1400.9,
      quantity: 10,
      userId: '2',
    });

    console.log('Placing ask order for 1501');
    await request(app).post('/order').send({
      type: 'limit',
      side: 'ask',
      price: 1501,
      quantity: 5,
      userId: '2',
    });

    let res = await request(app).get('/depth').send();
    console.log('Orderbook depth:', res.body.depth);
    expect(res.status).toBe(200);
    expect(res.body.depth['1501'].quantity).toBe(5);
  });

  it('ensures balances are still the same', async () => {
    let res = await request(app).get('/balance/1').send();
    console.log('Balance for user 1 after order:', res.body.balances);
    expect(res.body.balances[TICKER]).toBe(10);
  });

  it('Places an order that fills', async () => {
    let res = await request(app).post('/order').send({
      type: 'limit',
      side: 'bid',
      price: 1502,
      quantity: 2,
      userId: '1',
    });
    console.log('Filled quantity:', res.body.filledQuantity);
    expect(res.body.filledQuantity).toBe(2);
  });

  it('Ensures orderbook updates', async () => {
    let res = await request(app).get('/depth').send();
    console.log('Orderbook state after order:', res.body.depth);
    expect(res.body.depth['1400.9']?.quantity).toBe(8);
  });

  it('Ensures balances update', async () => {
    let res = await request(app).get('/balance/1').send();
    console.log('Balance for user 1 after order fill:', res.body.balances);
    expect(res.body.balances[TICKER]).toBe(12);
    console.log('Expected USD balance for user 1:', 50000 - 2 * 1400.9);
    expect(res.body.balances['USD']).toBe(50000 - 2 * 1400.9);

    res = await request(app).get('/balance/2').send();
    console.log('Balance for user 2 after order fill:', res.body.balances);
    expect(res.body.balances[TICKER]).toBe(8);
    expect(res.body.balances['USD']).toBe(50000 + 2 * 1400.9);
  });
}); 
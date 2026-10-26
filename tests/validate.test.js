'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const v = require('../server/utils/validate');

const code = (fn) => { try { fn(); } catch (e) { return `${e.code}${e.params?.field ? `:${e.params.field}` : ''}`; } return 'ok'; };

test('text: obligatorio, largo mínimo y máximo', () => {
  assert.equal(v.text('  hola ', 'name'), 'hola');
  assert.equal(code(() => v.text('', 'name')), 'validation.required:name');
  assert.equal(v.text('', 'name', { required: false }), null);
  assert.equal(code(() => v.text('a', 'name', { min: 2 })), 'validation.too_short:name');
  assert.equal(code(() => v.text('abcdef', 'name', { max: 3 })), 'validation.too_long:name');
});

test('number: rangos y valores no numéricos', () => {
  assert.equal(v.number('2500', 'price'), 2500);
  assert.equal(code(() => v.number('abc', 'price')), 'validation.not_a_number:price');
  assert.equal(code(() => v.number(-1, 'price')), 'validation.too_small:price');
  assert.equal(v.number('', 'stock', { required: false, fallback: 7 }), 7);
});

test('oneOf, id y email', () => {
  assert.equal(v.oneOf('cash', 'm', ['cash', 'card']), 'cash');
  assert.equal(code(() => v.oneOf('x', 'm', ['cash'])), 'validation.invalid_option:m');
  assert.equal(v.id('4', 'id'), 4);
  assert.equal(code(() => v.id('0', 'id')), 'validation.invalid_id:id');
  assert.equal(v.optionalId('', 'id'), null);
  assert.equal(v.email('a@b.co', 'email'), 'a@b.co');
  assert.equal(code(() => v.email('no-es-correo', 'email')), 'validation.invalid_email:email');
});

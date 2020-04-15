import { InputService } from './../src/input.service';
import { expect } from "chai";
import { stub } from 'sinon';
import {CurrencyMaskConfig, CurrencyMaskInputMode} from "../src/currency-mask.config";

describe('Testing InputService', () => {
  
  let options: CurrencyMaskConfig;
  let inputService: InputService;

  beforeEach(function() {
    options = {
      prefix: '',
      suffix: '',
      thousands: '.',
      decimal: ',',
      allowNegative: false,
      nullable: false,
      align: 'right',
      allowZero: true,
      precision: undefined,
    };
  });

  describe('removeNumber', () => {
    it('should call updateFieldValue with 1 when deleting the first number followed by a .', () => {
      inputService = new InputService({
        selectionStart: 0,
        selectionEnd: 0,
      }, options);

      inputService.inputManager.rawValue = '1.234,50';
      inputService.updateFieldValue = stub();
      inputService.removeNumber(46);
      expect(inputService.updateFieldValue).to.be.calledWith(1);
    });

    it('should call updateFieldValue with 2 when deleting the number after the .', () => {
      inputService = new InputService({
        selectionStart: 2,
        selectionEnd: 2,
      }, options);

      inputService.inputManager.rawValue = '0.01';
      inputService.updateFieldValue = stub();
      inputService.removeNumber(46);
      expect(inputService.updateFieldValue).to.be.calledWith(2);
    });

    it('should call updateFieldValue with 1 when backspacing the first number followed by a .', () => {
      inputService = new InputService({
        selectionStart: 1,
        selectionEnd: 1,
      }, options);

      inputService.inputManager.rawValue = '1.234,50';
      inputService.updateFieldValue = stub();
      inputService.removeNumber(8);
      expect(inputService.updateFieldValue).to.be.calledWith(1);
    });

    it('should call updateFieldValue with 2 less than the current position when backspacing any non-number character', () => {
      inputService = new InputService({
        selectionStart: 6,
        selectionEnd: 6,
      }, options);

      inputService.inputManager.rawValue = '1.234,50';
      inputService.updateFieldValue = stub();
      inputService.removeNumber(8);
      expect(inputService.updateFieldValue).to.be.calledWith(4);
    });

    it('should return a value without spaces when thousands separator is empty', () => {
      options.thousands = "";
      options.precision = 0;

      inputService = new InputService({
        selectionStart: 6,
        selectionEnd: 6,
      }, options);

      const result = inputService.applyMask(false, '234567');
      expect(result).to.equal('234567');
    });
  });

  describe('addNumber', () => {
    it('should default to min from empty raw value', () => {
      options.nullable = true;
      options.min = 10;
      options.precision = 0;
      inputService = new InputService({
        selectionStart: 0,
        selectionEnd: 0,
      }, options);

      inputService.inputManager.rawValue = null;
      inputService.addNumber(50); // '2'
      expect(inputService.value).to.be.equal(10);
    });

    it('should move past decimal when decimal typed', () => {
      const htmlInputElement = new MockHtmlInputElement(2, 2);
      options.precision = 2;
      inputService = new InputService(htmlInputElement, options);
      inputService.inputManager.rawValue = '12,34';

      // Typing , moves past the decimal separator.
      inputService.addNumber(44); // ','
      expect(inputService.value).to.be.equal(12.34);
      expect(htmlInputElement.selectionStart).to.be.equal(3);
      expect(htmlInputElement.selectionEnd).to.be.equal(3);

      // Typing it again should not move selection because we're already passed the separator.
      inputService.addNumber(44); // ','
      expect(inputService.value).to.be.equal(12.34);
      expect(htmlInputElement.selectionStart).to.be.equal(3);
      expect(htmlInputElement.selectionEnd).to.be.equal(3);
    });

    it('should move past decimal when decimal typed with selection range', () => {
      const htmlInputElement = new MockHtmlInputElement(1, 3);
      options.precision = 2;
      inputService = new InputService(htmlInputElement, options);
      inputService.inputManager.rawValue = '123,45';

      // "23" are selected. Typing , deletes the selection AND moves past the decimal separator.
      inputService.addNumber(44); // ','
      expect(inputService.value).to.be.equal(1.45);
      expect(htmlInputElement.selectionStart).to.be.equal(2);
      expect(htmlInputElement.selectionEnd).to.be.equal(2);
    });

    it('should move past thousands separator when thousands separator typed', () => {
      const htmlInputElement = new MockHtmlInputElement(1, 1);
      options.precision = 2;
      inputService = new InputService(htmlInputElement, options);
      inputService.inputManager.rawValue = '1.234,56';

      // Typing . moves past the thousands separator.
      inputService.addNumber(46); // '.'
      expect(inputService.value).to.be.equal(1234.56);
      expect(htmlInputElement.selectionStart).to.be.equal(2);
      expect(htmlInputElement.selectionEnd).to.be.equal(2);

      // Typing it again should not move selection because we're already passed the separator.
      inputService.addNumber(46); // '.'
      expect(inputService.value).to.be.equal(1234.56);
      expect(htmlInputElement.selectionStart).to.be.equal(2);
      expect(htmlInputElement.selectionEnd).to.be.equal(2);
    });

    it('should start before decimal char from empty string in natural mode', () => {
      const htmlInputElement = new MockHtmlInputElement(0, 0);
      options.precision = 2;
      options.prefix = '$$$',
      options.suffix =  '!!!',
      options.inputMode = CurrencyMaskInputMode.NATURAL;
      inputService = new InputService(htmlInputElement, options);
      inputService.inputManager.rawValue = '';

      inputService.addNumber(50); // '2'
      expect(inputService.value).to.be.equal(2);
      expect(inputService.rawValue).to.be.equal('$$$2,00!!!');
      expect(htmlInputElement.selectionStart).to.be.equal(4);
      expect(htmlInputElement.selectionEnd).to.be.equal(4);
    });

    it('should start after decimal char from empty string in natural mode', () => {
      const htmlInputElement = new MockHtmlInputElement(0, 0);
      options.precision = 2;
      options.prefix = '$$$',
      options.suffix =  '!!!',
      options.inputMode = CurrencyMaskInputMode.NATURAL;
      inputService = new InputService(htmlInputElement, options);
      inputService.inputManager.rawValue = '';

      inputService.addNumber(44); // ','
      expect(inputService.value).to.be.equal(0);
      expect(inputService.rawValue).to.be.equal('$$$0,00!!!');
      expect(htmlInputElement.selectionStart).to.be.equal(5);
      expect(htmlInputElement.selectionEnd).to.be.equal(5);
    });

    it('should replace decimals in natural mode', () => {
      const htmlInputElement = new MockHtmlInputElement(6, 6);
      options.precision = 2;
      options.prefix = '$$$',
      options.suffix =  '!!!',
      options.inputMode = CurrencyMaskInputMode.NATURAL;
      inputService = new InputService(htmlInputElement, options);
      inputService.inputManager.rawValue = '$$$12,34!!!';

      inputService.addNumber(53); // '5'
      expect(inputService.value).to.be.equal(12.54);
      expect(inputService.rawValue).to.be.equal('$$$12,54!!!');
      expect(htmlInputElement.selectionStart).to.be.equal(7);
      expect(htmlInputElement.selectionEnd).to.be.equal(7);

      inputService.addNumber(54); // '6'
      expect(inputService.value).to.be.equal(12.56);
      expect(inputService.rawValue).to.be.equal('$$$12,56!!!');
      expect(htmlInputElement.selectionStart).to.be.equal(8);
      expect(htmlInputElement.selectionEnd).to.be.equal(8);

      // Ignore characters that would increase past max precision.
      inputService.addNumber(55); // '7'
      expect(inputService.value).to.be.equal(12.56);
      expect(inputService.rawValue).to.be.equal('$$$12,56!!!');
      expect(htmlInputElement.selectionStart).to.be.equal(8);
      expect(htmlInputElement.selectionEnd).to.be.equal(8);
    });
  });

  describe('canInputMoreNumbers', () => {
    it('should return false when length of numbersOnlyInput >= maxLength', () => {
      inputService = new InputService({
        selectionStart: 0,
        selectionEnd: 0,
        maxLength: 6,
        value: 0
      }, options);
      inputService.inputManager.rawValue = '$1,234.56';
      expect(inputService.canInputMoreNumbers).to.be.false;
    });
    it('should return true when length of numbersOnlyInput < maxLength', () => {
      inputService = new InputService({
        selectionStart: 0,
        selectionEnd: 0,
        maxLength: 6,
        value: 0
      }, options);
      inputService.inputManager.rawValue = '$123.45';
      expect(inputService.canInputMoreNumbers).to.be.true;
    });
  });

  describe('applyMask', ()=> {
    it('should use precision 2 and consider decimal part when typing 1 with empty value', () => {        
      options.precision = 2;

      inputService = new InputService({
        selectionStart: 0,
        selectionEnd: 0
      }, options);

      const result = inputService.applyMask(false, '1');
      expect(result).to.be.equal('0,01');
    });

    it('should use precision 3 and consider decimal part when typing 1 with empty value', () => {
      options.precision = 3;

      inputService = new InputService({
        selectionStart: 0,
        selectionEnd: 0
      }, options);

      const result = inputService.applyMask(false, '1');
      expect(result).to.be.equal('0,001');
    });

    it('should use precision 2 when typing a key with previous value', () => {
      options.precision = 2;

      inputService = new InputService({
        selectionStart: 6,
        selectionEnd: 6
      }, options);
      
      const result = inputService.applyMask(false, '12345');
      expect(result).to.be.equal('123,45');
    });

    it('should use precision 3 when typing a key with previous value', () => {
      options.precision = 3;

      inputService = new InputService({
          selectionStart: 6,
          selectionEnd: 6
        }, options);

      const result = inputService.applyMask(false, '234567');
      expect(result).to.be.equal('234,567');
    });

    it('should limit to min', () => {
      options.precision = 0;
      options.allowNegative = true;
      inputService = new InputService({
          selectionStart: 0,
          selectionEnd: 0
        }, options);

      // Positive min.
      options.min = 10;
      expect(inputService.applyMask(false, '-1')).to.be.equal('10');
      expect(inputService.applyMask(false, '10')).to.be.equal('10');
      expect(inputService.applyMask(false, '11')).to.be.equal('11');

      // Negative min.
      options.min = -10;
      expect(inputService.applyMask(false, '-1')).to.be.equal('-1');
      expect(inputService.applyMask(false, '-10')).to.be.equal('-10');
      expect(inputService.applyMask(false, '-11')).to.be.equal('-10');
    });

    it('should limit to max', () => {
      options.precision = 0;
      options.allowNegative = true;
      inputService = new InputService({
          selectionStart: 0,
          selectionEnd: 0
        }, options);

      // Positive max
      options.max = 10;
      expect(inputService.applyMask(false, '-1')).to.be.equal('-1');
      expect(inputService.applyMask(false, '10')).to.be.equal('10');
      expect(inputService.applyMask(false, '11')).to.be.equal('10');

      // Negative max
      options.max = -10;
      expect(inputService.applyMask(false, '-1')).to.be.equal('-10');
      expect(inputService.applyMask(false, '-10')).to.be.equal('-10');
      expect(inputService.applyMask(false, '-11')).to.be.equal('-11');
    });

    it('should limit to min and max', () => {
      options.precision = 0;
      options.min = 10;
      options.max = 20;
      options.allowNegative = true;
      inputService = new InputService({
          selectionStart: 0,
          selectionEnd: 0
        }, options);

      expect(inputService.applyMask(false, '9')).to.be.equal('10');
      expect(inputService.applyMask(false, '10')).to.be.equal('10');
      expect(inputService.applyMask(false, '20')).to.be.equal('20');
      expect(inputService.applyMask(false, '21')).to.be.equal('20');
    });

    it('should ignore explicit null min and max', () => {
      options.precision = 0;
      options.min = null;
      options.max = null;
      options.allowNegative = true;
      inputService = new InputService({
          selectionStart: 0,
          selectionEnd: 0
        }, options);

      expect(inputService.applyMask(false, '-1')).to.be.equal('-1');
      expect(inputService.applyMask(false, '10')).to.be.equal('10');
    });

    it('should pad or trim in natural mode', () => {
      options.precision = 2;
      options.min = null;
      options.max = null;
      options.inputMode = CurrencyMaskInputMode.NATURAL;
      inputService = new InputService({
          selectionStart: 0,
          selectionEnd: 0
        }, options);

      expect(inputService.applyMask(false, '1')).to.be.equal('1,00');
      expect(inputService.applyMask(false, '12,34')).to.be.equal('12,34');
      expect(inputService.applyMask(false, '12,345')).to.be.equal('12,34');
    });

    it('should return formatted string when decimal char typed', () => {
      options.precision = 2;
      options.min = null;
      options.max = null;
      options.inputMode = CurrencyMaskInputMode.NATURAL;
      inputService = new InputService({
          selectionStart: 0,
          selectionEnd: 0
        }, options);

      expect(inputService.applyMask(false, ',')).to.be.equal('0,00');
    });
  });

  describe('padOrTrimPrecision', () => {
    it('should pad if insufficient precision', () => {
      options.precision = 3;
      inputService = new InputService({
        selectionStart: 0,
        selectionEnd: 0,
      }, options);

      expect(inputService.padOrTrimPrecision('1.234')).to.be.equal('1.234,000');
      expect(inputService.padOrTrimPrecision('1.234,5')).to.be.equal('1.234,500');
      expect(inputService.padOrTrimPrecision('1.234,56')).to.be.equal('1.234,560');
      expect(inputService.padOrTrimPrecision('1.234,567')).to.be.equal('1.234,567');
    });

    it('should trim excess decimals', () => {
      options.precision = 2;
      inputService = new InputService({
        selectionStart: 0,
        selectionEnd: 0,
      }, options);

      expect(inputService.padOrTrimPrecision('1.234,56')).to.be.equal('1.234,56');
      expect(inputService.padOrTrimPrecision('1.234,567')).to.be.equal('1.234,56');
      expect(inputService.padOrTrimPrecision('1.234,5678')).to.be.equal('1.234,56');
    });

    it('should trim all decimals if 0 precision', () => {
      options.precision = 0;
      inputService = new InputService({
        selectionStart: 0,
        selectionEnd: 0,
      }, options);

      expect(inputService.padOrTrimPrecision('1.234,56')).to.be.equal('1.234,');
      expect(inputService.padOrTrimPrecision('1.234')).to.be.equal('1.234,');
    });
  });
});

class MockHtmlInputElement {

  public focused: boolean;

  constructor(
    public selectionStart: number,
    public selectionEnd: number,
  ) {}

  public focus(): void {
    this.focused = true;    
  }

  public setSelectionRange(selectionStart: number, selectionEnd: number): void {
    this.selectionStart = selectionStart;
    this.selectionEnd = selectionEnd;
  }
}

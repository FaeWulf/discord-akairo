"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AkairoError_1 = __importDefault(require("../../util/AkairoError"));
const AkairoModule_1 = __importDefault(require("../AkairoModule"));
/**
 * Represents a listener.
 * @param id - Listener ID.
 * @param options - Options for the listener.
 */
class Listener extends AkairoModule_1.default {
    constructor(id, { category, emitter, event, type = "on" }) {
        super(id, { category });
        this.emitter = emitter;
        this.event = event;
        this.type = type;
    }
    /**
     * The event emitter.
     */
    emitter;
    /**
     * The event name listened to.
     */
    event;
    /**
     * Type of listener.
     */
    type;
    /**
     * Executes the listener.
     * @param args - Arguments.
     */
    // eslint-disable-next-line func-names, @typescript-eslint/no-unused-vars
    exec(...args) {
        throw new AkairoError_1.default("NOT_IMPLEMENTED", this.constructor.name, "exec");
    }
    /**
     * Reloads the listener.
     */
    reload() {
        return super.reload();
    }
    /**
     * Removes the listener.
     */
    remove() {
        return super.remove();
    }
}
exports.default = Listener;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlzdGVuZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc3RydWN0L2xpc3RlbmVycy9MaXN0ZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLHlFQUFpRDtBQUdqRCxtRUFBb0U7QUFHcEU7Ozs7R0FJRztBQUNILE1BQThCLFFBQVMsU0FBUSxzQkFBWTtJQUMxRCxZQUNDLEVBQVUsRUFDVixFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksR0FBRyxJQUFJLEVBQW1CO1FBRTFELEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBRXhCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBRXZCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBRW5CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ2xCLENBQUM7SUFZRDs7T0FFRztJQUNJLE9BQU8sQ0FBd0I7SUFFdEM7O09BRUc7SUFDSSxLQUFLLENBQVM7SUFZckI7O09BRUc7SUFDSSxJQUFJLENBQVM7SUFFcEI7OztPQUdHO0lBQ0gseUVBQXlFO0lBQ2xFLElBQUksQ0FBQyxHQUFHLElBQVc7UUFDekIsTUFBTSxJQUFJLHFCQUFXLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUVEOztPQUVHO0lBQ2EsTUFBTTtRQUNyQixPQUFPLEtBQUssQ0FBQyxNQUFNLEVBQWMsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7O09BRUc7SUFDYSxNQUFNO1FBQ3JCLE9BQU8sS0FBSyxDQUFDLE1BQU0sRUFBYyxDQUFDO0lBQ25DLENBQUM7Q0FDRDtBQXZFRCwyQkF1RUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gXCJldmVudHNcIjtcbmltcG9ydCBBa2Fpcm9FcnJvciBmcm9tIFwiLi4vLi4vdXRpbC9Ba2Fpcm9FcnJvclwiO1xuaW1wb3J0IENhdGVnb3J5IGZyb20gXCIuLi8uLi91dGlsL0NhdGVnb3J5XCI7XG5pbXBvcnQgQWthaXJvQ2xpZW50IGZyb20gXCIuLi9Ba2Fpcm9DbGllbnRcIjtcbmltcG9ydCBBa2Fpcm9Nb2R1bGUsIHsgQWthaXJvTW9kdWxlT3B0aW9ucyB9IGZyb20gXCIuLi9Ba2Fpcm9Nb2R1bGVcIjtcbmltcG9ydCBMaXN0ZW5lckhhbmRsZXIgZnJvbSBcIi4vTGlzdGVuZXJIYW5kbGVyXCI7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGxpc3RlbmVyLlxuICogQHBhcmFtIGlkIC0gTGlzdGVuZXIgSUQuXG4gKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbnMgZm9yIHRoZSBsaXN0ZW5lci5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgTGlzdGVuZXIgZXh0ZW5kcyBBa2Fpcm9Nb2R1bGUge1xuXHRwdWJsaWMgY29uc3RydWN0b3IoXG5cdFx0aWQ6IHN0cmluZyxcblx0XHR7IGNhdGVnb3J5LCBlbWl0dGVyLCBldmVudCwgdHlwZSA9IFwib25cIiB9OiBMaXN0ZW5lck9wdGlvbnNcblx0KSB7XG5cdFx0c3VwZXIoaWQsIHsgY2F0ZWdvcnkgfSk7XG5cblx0XHR0aGlzLmVtaXR0ZXIgPSBlbWl0dGVyO1xuXG5cdFx0dGhpcy5ldmVudCA9IGV2ZW50O1xuXG5cdFx0dGhpcy50eXBlID0gdHlwZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBUaGUgY2F0ZWdvcnkgb2YgdGhpcyBsaXN0ZW5lci5cblx0ICovXG5cdHB1YmxpYyBkZWNsYXJlIGNhdGVnb3J5OiBDYXRlZ29yeTxzdHJpbmcsIExpc3RlbmVyPjtcblxuXHQvKipcblx0ICogVGhlIEFrYWlybyBjbGllbnQuXG5cdCAqL1xuXHRwdWJsaWMgZGVjbGFyZSBjbGllbnQ6IEFrYWlyb0NsaWVudDtcblxuXHQvKipcblx0ICogVGhlIGV2ZW50IGVtaXR0ZXIuXG5cdCAqL1xuXHRwdWJsaWMgZW1pdHRlcjogc3RyaW5nIHwgRXZlbnRFbWl0dGVyO1xuXG5cdC8qKlxuXHQgKiBUaGUgZXZlbnQgbmFtZSBsaXN0ZW5lZCB0by5cblx0ICovXG5cdHB1YmxpYyBldmVudDogc3RyaW5nO1xuXG5cdC8qKlxuXHQgKiBUaGUgZmlsZXBhdGguXG5cdCAqL1xuXHRwdWJsaWMgZGVjbGFyZSBmaWxlcGF0aDogc3RyaW5nO1xuXG5cdC8qKlxuXHQgKiBUaGUgaGFuZGxlci5cblx0ICovXG5cdHB1YmxpYyBkZWNsYXJlIGhhbmRsZXI6IExpc3RlbmVySGFuZGxlcjtcblxuXHQvKipcblx0ICogVHlwZSBvZiBsaXN0ZW5lci5cblx0ICovXG5cdHB1YmxpYyB0eXBlOiBzdHJpbmc7XG5cblx0LyoqXG5cdCAqIEV4ZWN1dGVzIHRoZSBsaXN0ZW5lci5cblx0ICogQHBhcmFtIGFyZ3MgLSBBcmd1bWVudHMuXG5cdCAqL1xuXHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZnVuYy1uYW1lcywgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG5cdHB1YmxpYyBleGVjKC4uLmFyZ3M6IGFueVtdKTogYW55IHtcblx0XHR0aHJvdyBuZXcgQWthaXJvRXJyb3IoXCJOT1RfSU1QTEVNRU5URURcIiwgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lLCBcImV4ZWNcIik7XG5cdH1cblxuXHQvKipcblx0ICogUmVsb2FkcyB0aGUgbGlzdGVuZXIuXG5cdCAqL1xuXHRwdWJsaWMgb3ZlcnJpZGUgcmVsb2FkKCk6IExpc3RlbmVyIHtcblx0XHRyZXR1cm4gc3VwZXIucmVsb2FkKCkgYXMgTGlzdGVuZXI7XG5cdH1cblxuXHQvKipcblx0ICogUmVtb3ZlcyB0aGUgbGlzdGVuZXIuXG5cdCAqL1xuXHRwdWJsaWMgb3ZlcnJpZGUgcmVtb3ZlKCk6IExpc3RlbmVyIHtcblx0XHRyZXR1cm4gc3VwZXIucmVtb3ZlKCkgYXMgTGlzdGVuZXI7XG5cdH1cbn1cblxuLyoqXG4gKiBPcHRpb25zIHRvIHVzZSBmb3IgbGlzdGVuZXIgZXhlY3V0aW9uIGJlaGF2aW9yLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExpc3RlbmVyT3B0aW9ucyBleHRlbmRzIEFrYWlyb01vZHVsZU9wdGlvbnMge1xuXHQvKipcblx0ICogVGhlIGV2ZW50IGVtaXR0ZXIsIGVpdGhlciBhIGtleSBmcm9tIGBMaXN0ZW5lckhhbmRsZXIjZW1pdHRlcnNgIG9yIGFuIEV2ZW50RW1pdHRlci5cblx0ICovXG5cdGVtaXR0ZXI6IHN0cmluZyB8IEV2ZW50RW1pdHRlcjtcblxuXHQvKipcblx0ICogRXZlbnQgbmFtZSB0byBsaXN0ZW4gdG8uXG5cdCAqL1xuXHRldmVudDogc3RyaW5nO1xuXG5cdC8qKlxuXHQgKiBUeXBlIG9mIGxpc3RlbmVyLCBlaXRoZXIgJ29uJyBvciAnb25jZScuXG5cdCAqIERlZmF1bHRzIHRvIGBvbmBcblx0ICovXG5cdHR5cGU/OiBzdHJpbmc7XG59XG4iXX0=
import { describe, expect, it } from "bun:test";
import {
  createPaymentWsController,
  type PaymentWsSocket,
} from "./payment-ws-controller";

class FakeScheduler {
  private now = 0;
  private nextId = 1;
  private tasks: Array<{
    id: number;
    time: number;
    interval: number | null;
    cb: () => void;
    active: boolean;
  }> = [];

  setTimeout: typeof setTimeout = ((cb: () => void, delay = 0) => {
    const id = this.nextId++;
    this.tasks.push({
      id,
      time: this.now + delay,
      interval: null,
      cb,
      active: true,
    });
    return id as unknown as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;

  clearTimeout: typeof clearTimeout = ((id: ReturnType<typeof setTimeout>) => {
    this.tasks = this.tasks.map((task) =>
      task.id === Number(id) ? { ...task, active: false } : task,
    );
  }) as typeof clearTimeout;

  setInterval: typeof setInterval = ((cb: () => void, delay = 0) => {
    const id = this.nextId++;
    this.tasks.push({
      id,
      time: this.now + delay,
      interval: delay,
      cb,
      active: true,
    });
    return id as unknown as ReturnType<typeof setInterval>;
  }) as typeof setInterval;

  clearInterval: typeof clearInterval = ((id: ReturnType<typeof setInterval>) => {
    this.tasks = this.tasks.map((task) =>
      task.id === Number(id) ? { ...task, active: false } : task,
    );
  }) as typeof clearInterval;

  advanceBy(ms: number) {
    const target = this.now + ms;

    while (true) {
      const nextTask = this.tasks
        .filter((task) => task.active)
        .sort((a, b) => a.time - b.time)[0];

      if (!nextTask || nextTask.time > target) {
        break;
      }

      this.now = nextTask.time;
      if (!nextTask.active) continue;

      if (nextTask.interval === null) {
        nextTask.active = false;
      }

      nextTask.cb();

      if (nextTask.interval !== null && nextTask.active) {
        nextTask.time = this.now + nextTask.interval;
      }
    }

    this.now = target;
  }
}

class FakeSocket implements PaymentWsSocket {
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sentMessages: string[] = [];
  closeCount = 0;

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.closeCount += 1;
    this.onclose?.();
  }

  open() {
    this.readyState = 1;
    this.onopen?.();
  }

  message(data: unknown) {
    this.onmessage?.({ data });
  }

  error() {
    this.onerror?.();
  }
}

describe("createPaymentWsController", () => {
  it("não cria socket quando não existe paymentId", () => {
    const sockets: FakeSocket[] = [];
    const controller = createPaymentWsController({
      getPaymentId: () => null,
      onPaymentApproved: () => {},
      createSocket: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket;
      },
      socketOpenState: 1,
    });

    controller.connect();

    expect(sockets).toHaveLength(0);
  });

  it("entrega pagamento aprovado apenas para o paymentId atual", () => {
    const sockets: FakeSocket[] = [];
    const approvedEvents: string[] = [];
    const controller = createPaymentWsController({
      getPaymentId: () => "payment-1",
      onPaymentApproved: (data) => approvedEvents.push(data.paymentId),
      createSocket: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket;
      },
      socketOpenState: 1,
    });

    controller.connect();
    sockets[0]?.open();
    sockets[0]?.message(
      JSON.stringify({
        type: "payment_approved",
        paymentId: "payment-2",
        planExpiresAt: "2026-04-22T12:00:00.000Z",
      }),
    );
    sockets[0]?.message(
      JSON.stringify({
        type: "payment_approved",
        paymentId: "payment-1",
        planExpiresAt: "2026-04-22T12:00:00.000Z",
      }),
    );

    expect(approvedEvents).toEqual(["payment-1"]);
  });

  it("reaproveita a conexão aberta e só notifica que conectou", () => {
    const sockets: FakeSocket[] = [];
    let connectedCount = 0;
    const controller = createPaymentWsController({
      getPaymentId: () => "payment-1",
      onPaymentApproved: () => {},
      onConnected: () => {
        connectedCount += 1;
      },
      createSocket: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket;
      },
      socketOpenState: 1,
    });

    controller.connect();
    sockets[0]?.open();
    controller.connect();

    expect(sockets).toHaveLength(1);
    expect(connectedCount).toBe(2);
  });

  it("mantém a conexão aberta quando recebe pong dentro do prazo", () => {
    const scheduler = new FakeScheduler();
    const sockets: FakeSocket[] = [];
    const controller = createPaymentWsController({
      getPaymentId: () => "payment-1",
      onPaymentApproved: () => {},
      createSocket: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket;
      },
      socketOpenState: 1,
      setIntervalFn: scheduler.setInterval,
      clearIntervalFn: scheduler.clearInterval,
      setTimeoutFn: scheduler.setTimeout,
      clearTimeoutFn: scheduler.clearTimeout,
    });

    controller.connect();
    sockets[0]?.open();

    scheduler.advanceBy(25_000);
    expect(sockets[0]?.sentMessages).toEqual(["ping"]);

    scheduler.advanceBy(5_000);
    sockets[0]?.message("pong");
    scheduler.advanceBy(5_000);

    expect(sockets[0]?.closeCount).toBe(0);
  });

  it("fecha e reconecta quando o pong não chega", () => {
    const scheduler = new FakeScheduler();
    const sockets: FakeSocket[] = [];
    const controller = createPaymentWsController({
      getPaymentId: () => "payment-1",
      onPaymentApproved: () => {},
      createSocket: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket;
      },
      socketOpenState: 1,
      setIntervalFn: scheduler.setInterval,
      clearIntervalFn: scheduler.clearInterval,
      setTimeoutFn: scheduler.setTimeout,
      clearTimeoutFn: scheduler.clearTimeout,
    });

    controller.connect();
    sockets[0]?.open();

    scheduler.advanceBy(25_000);
    scheduler.advanceBy(10_000);

    expect(sockets[0]?.closeCount).toBe(1);

    scheduler.advanceBy(1_000);
    expect(sockets).toHaveLength(2);
  });

  it("fecha a conexão se receber erro do socket", () => {
    const scheduler = new FakeScheduler();
    const sockets: FakeSocket[] = [];
    const controller = createPaymentWsController({
      getPaymentId: () => "payment-1",
      onPaymentApproved: () => {},
      createSocket: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket;
      },
      socketOpenState: 1,
      setIntervalFn: scheduler.setInterval,
      clearIntervalFn: scheduler.clearInterval,
      setTimeoutFn: scheduler.setTimeout,
      clearTimeoutFn: scheduler.clearTimeout,
    });

    controller.connect();
    sockets[0]?.open();
    sockets[0]?.error();

    expect(sockets[0]?.closeCount).toBe(1);

    scheduler.advanceBy(1_000);
    expect(sockets).toHaveLength(2);
  });

  it("não reconecta depois de disconnect manual", () => {
    const scheduler = new FakeScheduler();
    const sockets: FakeSocket[] = [];
    const controller = createPaymentWsController({
      getPaymentId: () => "payment-1",
      onPaymentApproved: () => {},
      createSocket: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket;
      },
      socketOpenState: 1,
      setIntervalFn: scheduler.setInterval,
      clearIntervalFn: scheduler.clearInterval,
      setTimeoutFn: scheduler.setTimeout,
      clearTimeoutFn: scheduler.clearTimeout,
    });

    controller.connect();
    sockets[0]?.open();
    controller.disconnect();

    scheduler.advanceBy(60_000);

    expect(sockets).toHaveLength(1);
  });
});

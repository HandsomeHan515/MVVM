class Watcher { // 给需要变化的元素添加一个观察者，当数据变化后执行对应的方法
    constructor(vm, expr, cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        // 获取老值
        this.value = this.get();
    }

    getVal (vm, expr) {
        expr = expr.split('.');
        return expr.reduce((prev, next) => {
            return prev[next];
        }, vm.$data)
    }

    get () {
        Dep.target = this;
        let value = this.getVal(this.vm, this.expr)
        Dep.target = null;
        return value;
    }

    update () {
        let newVal = this.getVal(this.vm, this.expr);
        let oldVal = this.value
        // 用新值和老值进行对比，如果发生变化，就调用更新方法
        if (newVal !== oldVal) {
            // 进行更新
            this.cb(newVal);
        }
    }
}


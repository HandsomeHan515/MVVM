class Observer {
    constructor(data) {
        this.observe(data);
    }

    observe (data) {
        if (!data || typeof data !== 'object') {
            return;
        }

        Object.keys(data).forEach(key => {
            this.defineReactive(data, key, data[key]);
            // 深度递归劫持
            this.observe(data[key]);
        });
    }

    defineReactive (obj, key, value) {
        let _this = this;
        let dep = new Dep();

        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get () {
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set (newVal) {
                if (newVal !== value) {
                    _this.observe(newVal); // 如果是对象继续劫持
                    value = newVal;
                    dep.notify();
                }
            }
        })
    }
}
class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el); // #app document.querySelector
        this.vm = vm;
        if (this.el) {
            // 1. 先把真实的 DOM 放到 fragment 中
            let fragment = this.node2fragment(this.el);
            // 2. 编译 => 提取想要的元素节点 v-model 和文本节点 {{}}
            this.compile(fragment);
            // 3. 把编译好的 fragment 放到页面中
            this.el.appendChild(fragment);
        }
    }

    /* 辅助方法 */
    isElementNode (node) {
        return node.nodeType === 1
    }
    // 是不是指令
    isDirective (name) {
        return name.includes('v-');
    }
    /* 核心方法 */
    compile (fragment) {
        let childNodes = fragment.childNodes;
        Array.from(childNodes).forEach(node => {
            if (this.isElementNode(node)) {
                // 元素节点
                this.compileElement(node);
                this.compile(node);
            } else {
                // 文本节点
                this.compileText(node);
            }
        })
    }

    node2fragment (el) {
        let fragment = document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild) {
            fragment.appendChild(firstChild);
        }
        return fragment;
    }

    compileElement (node) {
        // v-model
        let attrs = node.attributes;
        Array.from(attrs).forEach(attr => {
            let attrName = attr.name
            if (this.isDirective(attrName)) {
                // 去对应的值放到节点中
                // vm.$data 
                let expr = attr.value;
                let type = attrName.slice(2)
                CompilerUtil[type](node, this.vm, expr);
            }
        })
    }

    compileText (node) {
        // {{}}
        let expr = node.textContent;
        let reg = /\{\{([^}]+)\}\}/g
        if (reg.test(expr)) {
            CompilerUtil['text'](node, this.vm, expr);
        }
    }
}

CompilerUtil = {
    getVal (vm, expr) {
        expr = expr.split('.');
        return expr.reduce((prev, next) => {
            return prev[next];
        }, vm.$data)
    },
    setVal (vm, expr, value) {
        expr = expr.split('.')
        return expr.reduce((prev, next, curIndex) => {
            if (curIndex === expr.length - 1) {
                return prev[next] = value;
            }
            return prev[next];
        }, vm.$data)
    },
    getTextVal (vm, expr) {
        return expr.replace(/\{\{([^}]+)\}\}/g, (...args) => {
            return this.getVal(vm, args[1]);
        })
    },
    text (node, vm, expr) { // 文本处理
        let updateFn = this.updater['textUpdater'];
        // message.a => ['message, 'a'] => vm.$data.message.a
        let value = this.getTextVal(vm, expr)

        expr.replace(/\{\{([^}]+)\}\}/g, (...args) => {
            new Watcher(vm, args[1], (newVal) => {
                updateFn && updateFn(node, this.getTextVal(vm, expr));
            })
        })
        updateFn && updateFn(node, value);
    },
    model (node, vm, expr) { // 输入框处理
        let updateFn = this.updater['modelUpdater'];
        // message.a => ['message, 'a'] => vm.$data.message.a

        // 添加监控，数据变化了，应该调用这个 watch 的 callback
        new Watcher(vm, expr, (newVal) => {
            updateFn && updateFn(node, this.getVal(vm, expr));
        })

        node.addEventListener('input', e => {
            let newVal = e.target.value;
            this.setVal(vm, expr, newVal);
        })
        updateFn && updateFn(node, this.getVal(vm, expr));
    },
    updater: {
        textUpdater (node, value) {
            node.textContent = value
        },
        modelUpdater (node, value) {
            node.value = value
        }
    }
}
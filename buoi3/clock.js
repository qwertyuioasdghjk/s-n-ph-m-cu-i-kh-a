class Clock {
    constructor() {
        this.timer = 0
        this.minute = 0
        this.second = 0
        this.timerElement = document.createElement('s')
        this.StopElement = document.createElement('button')
        this.StartElement = document.createElement('button')
        this.timerElement.innerText = '00:00'
        this.StartElement.innerText = 'Start'
        this.StopElement.innerText = 'Stop'

        this.StartElement.addEventListener('click', () => this.Start())
        this.StopElement.addEventListener('click', () => this.Stop())

        const div = document.createElement('div')
        div.appendChild(this.timerElement)
        div.appendChild(this.StartElement)
        div.appendChild(this.StopElement)

        document.body.appendChild(div)
    }
    start() {
        clearInterval(this.timer)
        this.timer = setInterval(() => {
            this.second++
            if (this.second === 60) {
                this.second = 0
                this.minute++
            }
            let minute = this.minute
            if (this.minute < 60) {
                minute = `0${this.minute}`

            }
            let second = this.second
            if (this.second < 60) {
                second = `0${this.second}`
            }
            this.timerElement.innerText = `${minute}:${second}`
        }, 1000)
    }

    stop() {
        clearInterval(this.timer)
        this.timerElement.innerText = `00:00`
    }
}
const clock1 = new Clock()
const clock2 = new Clock()



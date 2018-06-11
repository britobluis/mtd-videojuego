(function () {

    /*
    Elementos del DOM
    */
    var contenedor = $('#contenedor'),
        juego = $('#juego'),
        player = $('#jugador'),
        principal = $('#principal'),
        instrucciones = $('#instrucciones'),
        muestraScore = $('#puntaje output'),
        muestraDulzura = $('#dulzura output'),
        canvas = $('canvas'),
        over = $('#juegoterminado'),
        msjGameOver = over.querySelector('.mensaje'),
        caracteres = document.querySelectorAll('div.dentrointrucciones'),
        c = canvas.getContext('2d'),
        startenergy = +muestraDulzura.innerHTML;

    /*
    Datos del Juego
    */
    var scores = {
        energy: startenergy
    },
        playerincrease = +player.getAttribute('data-increase');

    /*
    Contadores
    */
    var score = 0,
        estadoDelJuego = null,
        x = 0,
        sprites = [],
        listaSprites = [],
        contadorSprite = 0,
        now = 0,
        viejo = null,
        playerY = 0,
        offset = 0,
        width = 0, height = 0,
        levelincrease = 0, i = 0,
        scoresGuardados = null,
        initsprites = 0,
        nuevoSprite = 500,
        rightdown = false,
        leftdown = false;
    /*
    Configuracion del juego
    */

    function init() {
        var actual, sprdata, informacionpuntaje, i, j;

        /*
        Trae el Sprite del HTML
        */
        sprdata = document.querySelectorAll('img.sprite');
        i = sprdata.length;
        while (i--) {
            actual = {};
            actual.effects = [];
            actual.img = sprdata[i];
            actual.offset = sprdata[i].offsetWidth / 2;
            informacionpuntaje = sprdata[i].getAttribute('data-collision').split(',');
            j = informacionpuntaje.length;
            while (j--) {
                var keyval = informacionpuntaje[j].split(':');
                actual.effects.push({
                    effect: keyval[0],
                    value: keyval[1]
                });
            }
            actual.type = sprdata[i].getAttribute('data-type');
            listaSprites.push(actual);
        }
        contadorSprite = listaSprites.length;
        initsprites = +$('#personajes').getAttribute('data-countstart');
        nuevoSprite = +$('#personajes').getAttribute('data-newsprite');

        /*
        Habilita el teclado en el juego
        */
        contenedor.tabIndex = -1;
        contenedor.focus();

        /*
        Asigna Manejadores de Eventos
        */
        contenedor.addEventListener('keydown', onkeydown, false);
        contenedor.addEventListener('keyup', onkeyup, false);
        contenedor.addEventListener('touchstart', ontouchstart, false);
        contenedor.addEventListener('touchend', ontouchend, false);
        contenedor.addEventListener('click', onclick, false);
        // contenedor.addEventListener('mousemove', onmousemove, false);
        window.addEventListener('deviceorientation', tilt, false);

        /*
        Trae el Score del juego o lo resetea si no hay ninguno
        */
        scoresGuardados = { last: 0, high: 0 };
        localStorage.html5catcher = JSON.stringify(scoresGuardados);

        /*
        Muestra la introduccion
        */
        showintro();

    };

    /*
    Función para cambiar el background durante el juego
    */

    function cambiaBackground() {
        var images = ['Assets/2.png', 'Assets/3.png', 'Assets/4.png', 'Assets/5.png', 'Assets/6.png', 'Assets/7.png', 'Assets/8.png']

        setInterval(function () {

            document.getElementById("cambiabackground").style.backgroundImage = "url('" + images[0] + "')";

            var firstValue = images.shift();
            images.push(firstValue);


        }, 12000);

    }

    /*
    Manejo de Clicks
    */
    function onclick(ev) {
        var t = ev.target;
        if (estadoDelJuego === 'gameover') {
            if (t.id === 'jugardenuevo') {
                showintro();
            }
        }
        if (t.className === 'proximo') {
            instruccionesSiguiente();
        }
        if (t.className === 'endinstructions') {
            instruccionesListo();
        }
        if (t.id === 'botoninstrucciones') {
            mostrarInstrucciones();
        }
        if (t.id === 'botonjugar') {
            startgame(),
                cambiaBackground();
        }
        ev.preventDefault();
    }

    /*
    Manejo de Teclado
    */
    function onkeydown(ev) {
        /* 
        Detecta el evento de que el usuario está utilizando el teclado
        y compara con los códigos ASCII del teclado para asignarle la función que corresponda
        */
        if (ev.keyCode === 39) {
            rightdown = true;
        }
        else if (ev.keyCode === 37) {
            leftdown = true;
        }
    }
    function onkeyup(ev) {
        if (ev.keyCode === 39) {
            rightdown = false;
        }
        else if (ev.keyCode === 37) {
            leftdown = false;
        }
    }

    /*
    Manejo de Touch Screen
    */
    function ontouchstart(ev) {
        if (gamestate === 'jugando') { ev.preventDefault(); }
    }
    function ontouchend(ev) {
        if (gamestate === 'jugando') { ev.preventDefault(); }
    }

    /*
    Manejo de Orientacion
    */
    function tilt(ev) {
        if (ev.gamma < 0) {
            x = x - 2;
        }
        if (ev.gamma > 0) {
            x = x + 2;
        }
        if (x < offset) {
            x = offset;
        }
        if (x > width - offset) {
            x = width - offset;
        }
    }

    /*
    Manejo del Mouse
    */
    // function onmousemove(ev) {
    //     var mx = ev.clientX - contenedor.offsetLeft;
    //     if (mx < offset) {
    //         mx = offset;
    //     }
    //     if (mx > width - offset) {
    //         mx = width - offset;
    //     }
    //     x = mx;
    // }

    /*
    Introduccion
    */
    function showintro() {
        setactual(principal);
        estadoDelJuego = 'principal';
        var scoreelms = principal.querySelectorAll('output');
        scoreelms[0].innerHTML = scoresGuardados.last;
        scoreelms[1].innerHTML = scoresGuardados.high;
    }

    /*
    Instrucciones
    */
    function mostrarInstrucciones() {
        setactual(instrucciones);
        estadoDelJuego = 'instrucciones';
        now = 0;
        caracteres[now].className = 'current';
    }

    /*
    Accion cuando se activa Izquierda
    */
    function instruccionesListo() {
        caracteres[now].className = 'dentrointrucciones';
        now = 0;
        showintro();
    }

    /*
    Accion cuando se activa Derecha
    */
    function instruccionesSiguiente() {
        if (caracteres[now + 1]) {
            now = now + 1;
        }
        if (caracteres[now]) {
            caracteres[now - 1].className = 'dentrointrucciones';
            caracteres[now].className = 'current';
        }
    }

    /*
    Comienza el Juego
    */
    function startgame() {
        setactual(juego);
        estadoDelJuego = 'jugando';
        document.body.className = 'jugando';
        width = juego.offsetWidth;
        height = juego.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        playerY = height - player.offsetHeight;
        offset = player.offsetWidth / 2;
        x = width / 2;
        sprites = [];
        for (i = 0; i < initsprites; i++) {
            sprites.push(addsprite());
        }
        scores.energy = startenergy;
        levelincrease = 0;
        score = 0;
        muestraDulzura.innerHTML = startenergy;
        loop();
    }

    /*
    Bucle Pricipal del Juego
    */
    function loop() {
        c.clearRect(0, 0, width, height);

        /*
        Renderiza y actualiza Sprites
        */
        j = sprites.length;
        for (i = 0; i < j; i++) {
            sprites[i].render();
            sprites[i].update();
        }

        /*
        Muestra Scores
        */
        muestraDulzura.innerHTML = scores.energy;
        muestraScore.innerHTML = ~~(score / 10);
        score++;

        /*
        Cuando aumenta Score agrega mas Sprites
        */
        if (~~(score / nuevoSprite) > levelincrease) {
            sprites.push(addsprite());
            levelincrease++;
        }

        /*
        Posicion Jugador
        */
        if (rightdown) {
            playerright();
        }
        if (leftdown) {
            playerleft();
        }

        c.save();
        c.translate(x - offset, playerY);
        c.drawImage(player, 0, 0);
        c.restore();

        /*
          Cuando aun tienes dulzura, renderiza Siguiente instruccion, sino gameover
         */
        scores.energy = Math.min(scores.energy, 100);
        if (scores.energy > 0) {
            requestAnimationFrame(loop);
        } else {
            gameover();
        }

    };

    /*
    Accion cuando se activa la izquierda
    */
    function playerleft() {
        x -= playerincrease;
        if (x < offset) {
            x = offset;
        }
    }

    /*
    Accion cuando se activa la derecha
    */
    function playerright() {
        x += playerincrease;
        if (x > width - offset) {
            x = width - offset;
        }
    }

    /*
    Game over
    */
    function gameover() {
        document.body.className = 'gameover';
        setactual(over);
        estadoDelJuego = 'gameover';
        var nowscore = ~~(score / 10);
        over.querySelector('output').innerHTML = nowscore;
        scoresGuardados.last = nowscore;
        if (nowscore > scoresGuardados.high) {
            msjGameOver.innerHTML = msjGameOver.getAttribute('data-highscore');
            scoresGuardados.high = nowscore;
        }
        localStorage.html5catcher = JSON.stringify(scoresGuardados);
    }

    /*
    Metodos de Ayuda
    */

    /*
    Sistema de Particulas
    */
    function sprite() {
        this.px = 0;
        this.py = 0;
        this.vx = 0;
        this.vy = 0;
        this.goodguy = false;
        this.height = 0;
        this.width = 0;
        this.effects = [];
        this.img = null;
        this.update = function () {
            this.px += this.vx;
            this.py += this.vy;
            if (~~(this.py + 10) > playerY) {
                if ((x - offset) < this.px && this.px < (x + offset)) {
                    this.py = -200;
                    i = this.effects.length;
                    while (i--) {
                        scores[this.effects[i].effect] += +this.effects[i].value;
                    }
                }
            }
            if (this.px > (width - this.offset) || this.px < this.offset) {
                this.vx = -this.vx;
            }
            if (this.py > height + 100) {
                if (this.type === 'bueno') {
                    i = this.effects.length;
                    while (i--) {
                        scores[this.effects[i].effect] -= +this.effects[i].value;
                    }
                }
                setspritedata(this);
            }
        };
        this.render = function () {
            c.save();
            c.translate(this.px, this.py);
            c.translate(this.width * -0.5, this.height * -0.5);
            c.drawImage(this.img, 0, 0);
            c.restore();
        };
    };

    function addsprite() {
        var s = new sprite();
        setspritedata(s);
        return s;
    };

    function setspritedata(sprite) {
        var r = ~~rand(0, contadorSprite);
        sprite.img = listaSprites[r].img;
        sprite.height = sprite.img.offsetHeight;
        sprite.width = sprite.img.offsetWidth;
        sprite.type = listaSprites[r].type;
        sprite.effects = listaSprites[r].effects;
        sprite.offset = listaSprites[r].offset;
        sprite.py = -100;
        sprite.px = rand(sprite.width / 2, width - sprite.width / 2);
        sprite.vx = rand(-1, 2);
        sprite.vy = rand(1, 5);
    };

    /*
    Seleccionador de Query
    */
    function $(str) {
        return document.querySelector(str);
    };

    /*
    Obtiene numero random entre un minimo y maximo
    */
    function rand(min, max) {
        return ((Math.random() * (max - min)) + min);
    };

    /*
    Muestra parte actual del juego y oculta la anterior
    */
    function setactual(elm) {
        if (viejo) {
            viejo.className = '';
        }
        elm.className = 'current';
        viejo = elm;
    };

    /*
    Detecta y Setea requestAnimationFrame
    */
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = (function () {
            return window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function (callback, element) {
                    window.setTimeout(callback, 1000 / 60);
                };
        })();
    }

    /*
    Ejecutar
    */
    init();
})();
/*
Fin del juego
*/

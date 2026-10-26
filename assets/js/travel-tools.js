(() => {
  "use strict";
  const isFrench = /^fr/i.test(document.documentElement.lang || location.pathname);
  const t = isFrench ? {
    loading: "Chargement des données…", failedWeather: "Impossible de récupérer la météo pour le moment. Réessayez dans un instant.",
    failedRates: "Les taux de référence ne sont pas disponibles pour cette paire. Choisissez une autre devise ou réessayez plus tard.",
    fetchError: "Connexion temporairement indisponible. Vérifiez votre connexion et réessayez.",
    current: "Actuellement", feels: "Ressenti", humidity: "Humidité", wind: "Vent", rain: "Précipitations",
    nextDays: "Prévisions sur 5 jours", today: "Aujourd’hui", clear: "Ciel dégagé", mainlyClear: "Principalement dégagé", partlyCloudy: "Partiellement nuageux", cloudy: "Couvert", fog: "Brouillard", drizzle: "Bruine", freezingDrizzle: "Bruine verglaçante", rainLight: "Pluie faible", rainModerate: "Pluie modérée", rainHeavy: "Forte pluie", freezingRain: "Pluie verglaçante", snow: "Neige", snowGrains: "Neige en grains", showers: "Averses", snowShowers: "Averses de neige", thunder: "Orage", thunderHail: "Orage avec grêle", unknown: "Conditions météo",
    pair: "Paire de devises", from: "De", to: "Vers", refDate: "Dernier taux de référence", change7: "Variation sur 7 jours", change30: "Variation sur 30 jours", volatility: "Volatilité annualisée", range30: "Évolution du taux de référence sur 30 jours", dataNote: "Ces taux de référence sont mis à jour quotidiennement les jours ouvrés. Ils ne constituent pas des cotations de trading en temps réel.", rateErr: "Données de référence indisponibles pour cette paire.", refresh: "Actualiser", live: "En ligne", rateSource: "Source des taux", weatherSource: "Source météo", country: "Données météo",
    cities: {meze:"Mèze",montpellier:"Montpellier",sete:"Sète",carcassonne:"Carcassonne",nimes:"Nîmes",andorra:"Andorre-la-Vieille",barcelona:"Barcelone",madrid:"Madrid",paris:"Paris",nice:"Nice",rome:"Rome",lisbon:"Lisbonne"},
    currencies:{EUR:"Euro",USD:"Dollar américain",GBP:"Livre sterling",CHF:"Franc suisse",PLN:"Zloty polonais",CZK:"Couronne tchèque",HUF:"Forint hongrois",RON:"Leu roumain",SEK:"Couronne suédoise",NOK:"Couronne norvégienne",DKK:"Couronne danoise",TRY:"Livre turque",CAD:"Dollar canadien",AUD:"Dollar australien",JPY:"Yen japonais",RUB:"Rouble russe",MAD:"Dirham marocain"}
  } : {
    loading: "Загружаем данные…", failedWeather: "Не удалось загрузить погоду. Попробуйте ещё раз.",
    failedRates: "Для этой валютной пары сейчас нет доступных курсов. Выберите другую валюту или попробуйте позже.",
    fetchError: "Соединение временно недоступно. Проверьте интернет и попробуйте снова.",
    current: "Сейчас", feels: "Ощущается как", humidity: "Влажность", wind: "Ветер", rain: "Осадки",
    nextDays: "Прогноз на 5 дней", today: "Сегодня", clear: "Ясно", mainlyClear: "Преимущественно ясно", partlyCloudy: "Переменная облачность", cloudy: "Пасмурно", fog: "Туман", drizzle: "Морось", freezingDrizzle: "Ледяная морось", rainLight: "Небольшой дождь", rainModerate: "Умеренный дождь", rainHeavy: "Сильный дождь", freezingRain: "Ледяной дождь", snow: "Снег", snowGrains: "Снежная крупа", showers: "Ливни", snowShowers: "Снегопад", thunder: "Гроза", thunderHail: "Гроза с градом", unknown: "Погодные условия",
    pair: "Валютная пара", from: "Из", to: "В", refDate: "Последний справочный курс", change7: "Изменение за 7 дней", change30: "Изменение за 30 дней", volatility: "Годовая волатильность", range30: "Изменение курса за 30 дней", dataNote: "Справочные курсы обновляются ежедневно в рабочие дни. Это не биржевые котировки в реальном времени.", rateErr: "Нет доступных справочных данных для этой пары.", refresh: "Обновить", live: "Онлайн", rateSource: "Источник курсов", weatherSource: "Источник погоды", country: "Погодные данные",
    cities: {meze:"Мез",montpellier:"Монпелье",sete:"Сет",carcassonne:"Каркассон",nimes:"Ним",andorra:"Андорра-ла-Велья",barcelona:"Барселона",madrid:"Мадрид",paris:"Париж",nice:"Ницца",rome:"Рим",lisbon:"Лиссабон"},
    currencies:{EUR:"Евро",USD:"Доллар США",GBP:"Фунт стерлингов",CHF:"Швейцарский франк",PLN:"Польский злотый",CZK:"Чешская крона",HUF:"Венгерский форинт",RON:"Румынский лей",SEK:"Шведская крона",NOK:"Норвежская крона",DKK:"Датская крона",TRY:"Турецкая лира",CAD:"Канадский доллар",AUD:"Австралийский доллар",JPY:"Японская иена",RUB:"Российский рубль",MAD:"Марокканский дирхам"}
  };

  const cities = {
    meze: {lat:43.425,lon:3.605}, montpellier:{lat:43.6119,lon:3.8772}, sete:{lat:43.4028,lon:3.6963},
    carcassonne:{lat:43.213,lon:2.351}, nimes:{lat:43.8367,lon:4.3601}, andorra:{lat:42.5063,lon:1.5218},
    barcelona:{lat:41.3874,lon:2.1686}, madrid:{lat:40.4168,lon:-3.7038}, paris:{lat:48.8566,lon:2.3522},
    nice:{lat:43.7102,lon:7.262}, rome:{lat:41.9028,lon:12.4964}, lisbon:{lat:38.7223,lon:-9.1393}
  };
  const currencyCodes = ["EUR","USD","GBP","CHF","PLN","CZK","HUF","RON","SEK","NOK","DKK","TRY","CAD","AUD","JPY","RUB","MAD"];
  const weatherBody = document.getElementById("tt-weather-body");
  const ratesBody = document.getElementById("tt-rates-body");
  const citySelect = document.getElementById("tt-city");
  const baseSelect = document.getElementById("tt-base");
  const quoteSelect = document.getElementById("tt-quote");
  const refreshButton = document.getElementById("tt-refresh");
  const ratesRefreshButton = document.getElementById("tt-rates-refresh");
  if (!weatherBody || !ratesBody || !citySelect || !baseSelect || !quoteSelect) return;

  const cache = new Map();
  const fmt = (n, maximumFractionDigits=1) => new Intl.NumberFormat(isFrench ? "fr-FR" : "ru-RU", {maximumFractionDigits}).format(n);
  const dateFmt = (s, options={weekday:"short",day:"numeric",month:"short"}) => {
    const d = new Date(s + "T12:00:00Z");
    return d.toLocaleDateString(isFrench ? "fr-FR" : "ru-FR", options);
  };
  const tempFmt = n => Math.round(n) + "°";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const wmo = code => {
    if (code===0) return {label:t.clear,icon:"☀️"};
    if (code===1) return {label:t.mainlyClear,icon:"🌤️"};
    if (code===2) return {label:t.partlyCloudy,icon:"⛅"};
    if (code===3) return {label:t.cloudy,icon:"☁️"};
    if (code===45||code===48) return {label:t.fog,icon:"🌫️"};
    if ([51,53,55].includes(code)) return {label:t.drizzle,icon:"🌦️"};
    if ([56,57].includes(code)) return {label:t.freezingDrizzle,icon:"🌧️"};
    if (code===61) return {label:t.rainLight,icon:"🌦️"};
    if (code===63) return {label:t.rainModerate,icon:"🌧️"};
    if (code===65) return {label:t.rainHeavy,icon:"🌧️"};
    if ([66,67].includes(code)) return {label:t.freezingRain,icon:"🌧️"};
    if ([71,73,75].includes(code)) return {label:t.snow,icon:"❄️"};
    if (code===77) return {label:t.snowGrains,icon:"❄️"};
    if ([80,81,82].includes(code)) return {label:t.showers,icon:"🌧️"};
    if ([85,86].includes(code)) return {label:t.snowShowers,icon:"🌨️"};
    if (code===95) return {label:t.thunder,icon:"⛈️"};
    if ([96,99].includes(code)) return {label:t.thunderHail,icon:"⛈️"};
    return {label:t.unknown,icon:"🌡️"};
  };
  async function getJson(url) {
    const cached = cache.get(url);
    if (cached && Date.now()-cached.time < 10*60*1000) return cached.value;
    const response = await fetch(url, {headers:{"Accept":"application/json"},cache:"no-store"});
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();
    cache.set(url,{time:Date.now(),value:data});
    return data;
  }
  function showError(el, message) { el.innerHTML = '<div class="tt-error">' + esc(message) + '</div>'; }
  function cityName(key) { return t.cities[key] || key; }

  async function loadWeather() {
    const key = citySelect.value in cities ? citySelect.value : "meze";
    const city = cities[key];
    weatherBody.innerHTML = '<p class="tt-loading">' + esc(t.loading) + '</p>';
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + city.lat + "&longitude=" + city.lon +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&forecast_days=5&timezone=auto";
    try {
      const data = await getJson(url);
      if (!data.current || !data.daily) throw new Error("Missing weather data");
      const now = data.current, condition = wmo(now.weather_code);
      const daily = data.daily.time.map((date,i) => ({
        date, code:data.daily.weather_code[i], high:data.daily.temperature_2m_max[i],
        low:data.daily.temperature_2m_min[i], rain:data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[i] : null
      }));
      const dateTime = String(now.time || "").replace("T"," ");
      weatherBody.innerHTML =
        '<div class="tt-current"><div class="tt-weather-icon" aria-hidden="true">' + condition.icon + '</div><div><div class="tt-temp">' + tempFmt(now.temperature_2m) + '</div><div class="tt-condition">' + esc(condition.label) + '</div><div class="tt-updated">' + esc(cityName(key)) + ' · ' + esc(dateTime) + '</div></div></div>' +
        '<div class="tt-weather-metrics">' +
          '<div class="tt-metric"><small>' + esc(t.feels) + '</small><strong>' + tempFmt(now.apparent_temperature) + '</strong></div>' +
          '<div class="tt-metric"><small>' + esc(t.humidity) + '</small><strong>' + fmt(now.relative_humidity_2m,0) + '%</strong></div>' +
          '<div class="tt-metric"><small>' + esc(t.wind) + '</small><strong>' + fmt(now.wind_speed_10m,0) + ' km/h</strong></div>' +
        '</div><p class="tt-forecast-title">' + esc(t.nextDays) + '</p><div class="tt-forecast">' +
        daily.map((d,i) => {
          const c = wmo(d.code);
          const name = i===0 ? t.today : dateFmt(d.date,{weekday:"short"});
          const rain = d.rain === null || d.rain === undefined ? "" : '<div class="tt-day-rain">☂ ' + fmt(d.rain,0) + '%</div>';
          return '<div class="tt-day"><div class="tt-day-name">' + esc(name) + '</div><div class="tt-day-icon" aria-label="' + esc(c.label) + '">' + c.icon + '</div><div class="tt-day-temp">' + tempFmt(d.high) + '</div><div class="tt-day-temp" style="font-weight:500;color:#849085">' + tempFmt(d.low) + '</div>' + rain + '</div>';
        }).join("") + '</div>';
    } catch (e) {
      showError(weatherBody,t.failedWeather);
    }
  }

  function makeCurrencyOptions() {
    const existing = new Set(Array.from(baseSelect.options).map(o=>o.value));
    currencyCodes.forEach(code => {
      if (!existing.has(code)) {
        const name = t.currencies[code] || code;
        [baseSelect, quoteSelect].forEach(select => {
          const option = document.createElement("option");
          option.value = code; option.textContent = code + " — " + name;
          select.appendChild(option);
        });
      }
    });
  }
  function minusDays(date, days) { const d = new Date(date); d.setUTCDate(d.getUTCDate()-days); return d.toISOString().slice(0,10); }
  function pctChange(a,b) { return a ? (b/a-1)*100 : null; }
  function stddev(values) {
    if (values.length < 2) return null;
    const mean=values.reduce((sum,v)=>sum+v,0)/values.length;
    const variance=values.reduce((sum,v)=>sum+(v-mean)*(v-mean),0)/(values.length-1);
    return Math.sqrt(variance);
  }
  function pctText(v) {
    if (!Number.isFinite(v)) return "—";
    const sign=v>0?"+":v<0?"−":"";
    return sign + fmt(Math.abs(v),2) + "%";
  }
  function rateFmt(v) { return new Intl.NumberFormat(isFrench?"fr-FR":"ru-RU",{maximumFractionDigits:5,minimumFractionDigits:2}).format(v); }

  async function loadRates() {
    const base=baseSelect.value.toUpperCase(), quote=quoteSelect.value.toUpperCase();
    if (base===quote) { showError(ratesBody,isFrench?"Choisissez deux devises différentes.":"Выберите две разные валюты."); return; }
    ratesBody.innerHTML='<p class="tt-loading">' + esc(t.loading) + '</p>';
    const end=new Date(), start=minusDays(end,40), endString=end.toISOString().slice(0,10), thirtyAgo=minusDays(end,30), sevenAgo=minusDays(end,7);
    const url="https://api.frankfurter.dev/v2/rates?base="+encodeURIComponent(base.toLowerCase())+"&quotes="+encodeURIComponent(quote.toLowerCase())+"&from="+start+"&to="+endString;
    try {
      const raw=await getJson(url);
      const rows=(Array.isArray(raw)?raw:[]).filter(r=>r && Number.isFinite(Number(r.rate)) && r.date).sort((a,b)=>a.date.localeCompare(b.date));
      if (rows.length<2) throw new Error("No series");
      const last=rows[rows.length-1];
      const onOrBefore=(date) => {
        const found=rows.filter(r=>r.date<=date);
        return found.length ? found[found.length-1] : rows[0];
      };
      const r7=onOrBefore(sevenAgo), r30=onOrBefore(thirtyAgo);
      const changes7=pctChange(Number(r7.rate),Number(last.rate));
      const changes30=pctChange(Number(r30.rate),Number(last.rate));
      const recent=rows.filter(r=>r.date>=thirtyAgo);
      const returns=[];
      for(let i=1;i<recent.length;i++) returns.push(Math.log(Number(recent[i].rate)/Number(recent[i-1].rate)));
      const sdev=stddev(returns);
      const annualized=sdev===null?null:sdev*Math.sqrt(252)*100;
      const values=recent.map(r=>Number(r.rate));
      const min=Math.min.apply(null,values), max=Math.max.apply(null,values);
      const w=320,h=64,pad=4,spread=max-min||1;
      const coords=values.map((v,i)=>({x:pad+(values.length<2?0:i*(w-2*pad)/(values.length-1)),y:h-pad-((v-min)/spread)*(h-2*pad)}));
      const path=coords.map((p,i)=>(i===0?"M":"L")+p.x.toFixed(2)+" "+p.y.toFixed(2)).join(" ");
      const lastPoint=coords[coords.length-1];
      const chart='<svg class="tt-chart" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(t.range30)+'"><path d="'+path+'" fill="none" stroke="#78966f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="'+lastPoint.x+'" cy="'+lastPoint.y+'" r="4.5" fill="#183d29"/></svg>';
      const directionClass = v => v>0?"tt-positive":v<0?"tt-negative":"";
      const unit=isFrench?"taux indicatif":"справочный курс";
      ratesBody.innerHTML =
        '<div class="tt-rate-line"><div class="tt-rate-caption">1 ' + esc(base) + ' =</div><div class="tt-rate">' + rateFmt(Number(last.rate)) + ' ' + esc(quote) + '</div><div class="tt-rate-date">' + esc(t.refDate) + ': ' + esc(last.date) + '</div></div>' +
        '<p class="tt-forecast-title">' + esc(t.range30) + '</p><div class="tt-chart-wrap">' + chart + '</div>' +
        '<div class="tt-stat-grid">' +
          '<div class="tt-stat"><small>' + esc(t.change7) + '</small><strong class="' + directionClass(changes7) + '">' + pctText(changes7) + '</strong></div>' +
          '<div class="tt-stat"><small>' + esc(t.change30) + '</small><strong class="' + directionClass(changes30) + '">' + pctText(changes30) + '</strong></div>' +
          '<div class="tt-stat"><small>' + esc(t.volatility) + '</small><strong>' + (annualized===null?"—":fmt(annualized,1)+"%") + '</strong></div>' +
        '</div><p class="tt-note">' + esc(isFrench?"Calcul estimatif de l'écart-type annualisé des variations logarithmiques quotidiennes sur environ 30 jours.":"Оценка годовой волатильности через стандартное отклонение дневных логарифмических изменений примерно за 30 дней.") + '</p>';
    } catch (e) {
      showError(ratesBody,t.failedRates);
    }
  }

  if (!baseSelect.options.length) currencyCodes.forEach(code=>{
    [baseSelect,quoteSelect].forEach(select=>{
      const option=document.createElement("option");
      option.value=code;
      option.textContent=code+" — "+(t.currencies[code]||code);
      select.appendChild(option);
    });
  });
  if ([...baseSelect.options].some(o=>o.value==="EUR")) baseSelect.value="EUR";
  if ([...quoteSelect.options].some(o=>o.value==="USD")) quoteSelect.value="USD";
  citySelect.addEventListener("change",loadWeather);
  baseSelect.addEventListener("change",loadRates);
  quoteSelect.addEventListener("change",loadRates);
  if (refreshButton) refreshButton.addEventListener("click",loadWeather);
  if (ratesRefreshButton) ratesRefreshButton.addEventListener("click",loadRates);
  loadWeather();
  loadRates();
})();

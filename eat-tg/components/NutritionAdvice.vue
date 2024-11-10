<template>
  <v-container class="ma-0 pa-0">
    <!-- Содержимое вкладок -->
        <!-- Список советов по выбранной теме -->
        <v-expansion-panels
            v-for="(topic, index) in topics"
            :key="index"
            class="ma-0 pa-0"
        >
          <v-expansion-panel
              v-for="(advice, i) in topic.advices"
              :key="i"
              class="advice-item"
          >
            <v-expansion-panel-title class="advice-title">
              {{ advice.title }}
            </v-expansion-panel-title>
            <v-expansion-panel-text class="advice-content">
              <div v-html="advice.content"></div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref(0)

const topics = [
  {
    title: 'Азы питания',
    advices: [
      {
        title: 'Азы питания',
        content: `
          <p style="margin-bottom: 5px; padding: 5px;">Ешьте побольше белковой пищи (яйца, курица, говядина, рыба и любые морепродукты, творог).</p>
          <p style="margin-bottom: 5px; padding: 5px;">Уберите из рациона пищевой мусор (сахар в чае, хлеб к основному блюду, выпечку, майонез, газировки и т.д.).</p>
          <p style="margin-bottom: 5px; padding: 5px;">Не забывайте пить воду (около литра в день будет вполне достаточно).</p>
          <p style="margin-bottom: 5px; padding: 5px;">Кушайте 3 раза в день основательно (завтрак, обед, ужин), допускается 1-2 перекуса (желательно тем же белком). Основные приёмы пищи должны содержать любую крупу + белок.</p>
          <p style="padding: 5px;">Ешьте зелёные овощи (огурцы, помидоры, перец и т.д.).</p>
        `,
      },
    ],
  },
  {
    title: 'Питание перед тренировкой',
    advices: [
      {
        title: 'Питание перед тренировкой',
        content: `
          <p>Перед тренировкой нужно обязательно покушать любую крупу с белком за 1,5–2 часа до тренировки.</p>
          <p style="margin-bottom: 5px; padding: 5px;">Не рекомендуется есть жирное.</p>
          <p style="margin-bottom: 5px; padding: 5px;">Если вы не успели покушать — съешьте что-нибудь углеводное (фрукты, йогурты с вкусами; при работе на массу можно выпечку и сладкое).</p>
          <p style="padding: 5px;">Если чувствуете себя уставшим, выпейте чашку кофе за полчаса до тренировки.</p>
        `,
      },
    ],
  },
  {
    title: 'На массу',
    advices: [
      {
        title: 'Питание на массу',
        content: `
          <p>Питаться на набор массы гораздо легче, чем на похудение.</p>
          <p style="margin-bottom: 5px; padding: 5px;">Основа рациона — 3-разовое питание; в перекусы добавляем фрукты, любые орехи (около 30 г за одну порцию).</p>
          <p style="margin-bottom: 5px; padding: 5px;">Для роста мышц необходимо определённое количество белка: мужчинам около 2 г на 1 кг своего веса, женщинам около 1,5 г на 1 кг своего веса.</p>
          <p style="margin-bottom: 5px; padding: 5px;"><strong>Плотное телосложение:</strong> Будьте осторожнее с излишками сладкого; старайтесь наполнить рацион крупами и белковой пищей.</p>
          <p style="margin: 5px 0; padding: 5px;"><strong>Худощавое телосложение:</strong> Если жир не откладывается, можете добавлять сладкое и мучное (для добора углеводов), орехи (для калорийности).</p>
          <p>Помните, что набор мышечной массы зависит от рабочих весов в базовых упражнениях и общего объёма тренировки. Если сделали только 2 рабочих подхода в жиме лёжа — не ждите роста. Если не можете сделать 3-й подход — возможно, торопитесь увеличивать вес.</p>
        `,
      },
    ],
  },
  {
    title: 'На похудение',
    advices: [
      {
        title: 'Питание на похудение',
        content: `
          <p style="margin: 5px 0; padding: 5px;">За основу питания берём 3-разовое питание (завтрак, обед, ужин). Все пункты из раздела "Азы" должны соблюдаться на 100%.</p>
          <p style="margin: 5px 0; padding: 5px;">Завтрак: крупа + белок<br>
          Обед: крупа + белок<br>
          Перекус: белок<br>
          Ужин: крупа + белок<br>
          Возможен ещё один перекус белком.</p>
          <p style="margin: 5px 0; padding: 5px;">"Крупа + белок" — на тарелке гарнир и мясо/рыба должны выглядеть 50/50, не бойтесь переесть гарнира.</p>
        `,
      },
    ],
  },
  // Добавьте дополнительные советы (5–8), если они есть
]
</script>

<style scoped>
/* Ваши стили остаются прежними */
.nutrition-container {
  max-width: 800px;
  margin: 0 auto;
  background-color: #121212; /* Тёмный фон контейнера */
  padding: 16px;
  border-radius: 12px;
}

.custom-tabs {
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.custom-tab {
  color: #ffffff;
  text-transform: none;
  font-size: 16px;
  padding: 8px 12px;
  margin: 0 1px; /* Минимальные горизонтальные отступы */
  transition: background-color 0.3s, color 0.3s;
  border-radius: 4px;
}

.custom-tab:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.v-tab--active .custom-tab {
  background-color: #43a047; /* Цвет активной вкладки */
  color: #ffffff;
}

.advice-item {
  margin-bottom: 8px;
  background-color: #FFFFFF33;
  border-color: rgb(51, 51, 51);
}

.advice-title {
  color: #ffffff;
}

.advice-content {
  background-color: #333333;
  color: #b0bec5;
}

.headline {
  font-weight: bold;
  font-size: 20px;
  color: #ffffff;
}

.v-card {
  background-color: #1e1e1e; /* Тёмный фон карточек */
  color: #ffffff;
}

.v-btn {
  color: #43a047;
}

@media (max-width: 800px) {
  .custom-tab {
    font-size: 14px;
    padding: 6px 8px;
    margin: 0 0.5px;
  }

  .advice-title {
    font-size: 16px;
  }

  .advice-content {
    font-size: 16px;
  }

  .headline {
    font-size: 20px;
  }
}

</style>

CREATE TABLE IF NOT EXISTS menu_positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(32) NOT NULL DEFAULT 'Unknown',
    cost DOUBLE PRECISION NOT NULL,
    type VARCHAR(32) NOT NULL,
    preview_link VARCHAR(32) DEFAULT '/unknown.png',
    description VARCHAR(256),
    characteristics JSONB NOT NULL,
    ingredients JSONB NOT NULL,
    additions JSONB NOT NULL
);

INSERT INTO menu_positions (name, cost, type, preview_link, description, characteristics, ingredients, additions) VALUES
('Сырная', 0.067683, 'pizza', '/cheese.avif', 'Моцарелла, сыры чеддер и пармезан, фирменный соус альфредо', '{"calories": 250, "protein": 12, "fat": 8, "carbohydrates": 35}', '["фирменный соус альфредо", "моцарелла", "сыры чеддер", "пармезан"]', '["сырный бортик", "острый перец", "чесночный соус"]'),
('Пепперони', 0.082724, 'pizza', '/pepperoni.avif', 'Острая пицца с пепперони и сыром моцарелла', '{"calories": 280, "protein": 15, "fat": 12, "carbohydrates": 32}', '["томатный соус", "моцарелла", "пепперони"]', '["сырный бортик", "острый перец", "двойная порция пепперони"]'),
('Гавайская', 0.078212, 'pizza', '/hawaiian.avif', 'Пицца с ветчиной и ананасами', '{"calories": 260, "protein": 14, "fat": 9, "carbohydrates": 38}', '["томатный соус", "моцарелла", "ветчина", "ананасы"]', '["сырный бортик", "кукуруза", "чесночный соус"]'),
('Четыре сыра', 0.090244, 'pizza', '/four_cheese.avif', 'Пицца с четырьмя видами сыра', '{"calories": 320, "protein": 18, "fat": 16, "carbohydrates": 28}', '["томатный соус", "моцарелла", "горгонзола", "пармезан", "рикотта"]', '["сырный бортик", "орегано", "оливковое масло"]'),
('Охотничья', 0.097764, 'pizza', '/meat.avif', 'Пицца с различными видами мяса', '{"calories": 350, "protein": 22, "fat": 18, "carbohydrates": 30}', '["двойная порция классических колбасок", "красный лук", "томаты", "соус барбекю", "моцарелла", "фирменный томатный соус"]', '["сырный бортик", "острый соус", "двойная порция мяса"]'),
('Конструктор пиццы', 0.060163, 'pizza_constructor', '/constructor.avif', 'Создайте свою уникальную пиццу', '{"calories": 200, "protein": 10, "fat": 6, "carbohydrates": 25}', '["томатный соус", "моцарелла"]', '["ветчина", "пепперони", "курица", "грибы", "перец", "лук", "оливки", "ананасы", "кукуруза"]'),
('Картофель фри', 0.027073, 'snack', '/fries.avif', 'Хрустящий картофель фри с солью', '{"calories": 320, "protein": 4, "fat": 15, "carbohydrates": 42}', '["картофель", "соль", "растительное масло"]', '["сырный соус", "кетчуп", "майонез"]'),
('Наггетсы', 0.03309, 'snack', '/nuggets.avif', 'Куриные наггетсы в хрустящей панировке', '{"calories": 280, "protein": 16, "fat": 18, "carbohydrates": 12}', '["куриное филе", "панировка", "специи"]', '["сырный соус", "барбекю соус", "сметанный соус"]'),
('Кола', 0.018049, 'drink', '/cola.avif', 'Освежающий газированный напиток', '{"calories": 140, "protein": 0, "fat": 0, "carbohydrates": 35}', '["вода", "сахар", "ароматизаторы"]', '["лёд", "лимон"]'),
('Морс', 0.022561, 'drink', '/morse.avif', 'Натуральный морс', '{"calories": 110, "protein": 2, "fat": 0, "carbohydrates": 26}', '["морс"]', '["лёд", "мята"]'),
('Зеленый чай', 0.022561, 'drink', '/green_tea.avif', 'Холодный зеленый чай', '{"calories": 120, "protein": 0, "fat": 0, "carbohydrates": 0}', '["вода, чай"]', '["лёд", "лимон"]')
ON CONFLICT (id) DO NOTHING;
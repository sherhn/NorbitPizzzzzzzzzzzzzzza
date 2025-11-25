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
('Маргарита', 450.0, 'pizza', '/margarita.png', 'Классическая итальянская пицца с томатным соусом и моцареллой', '{"calories": 250, "protein": 12, "fat": 8, "carbohydrates": 35}', '["томатный соус", "моцарелла", "базилик"]', '["сырный бортик", "острый перец", "чесночный соус"]'),
('Пепперони', 550.0, 'pizza', '/pepperoni.png', 'Острая пицца с пепперони и сыром моцарелла', '{"calories": 280, "protein": 15, "fat": 12, "carbohydrates": 32}', '["томатный соус", "моцарелла", "пепперони"]', '["сырный бортик", "острый перец", "двойная порция пепперони"]'),
('Гавайская', 520.0, 'pizza', '/hawaiian.png', 'Пицца с ветчиной и ананасами', '{"calories": 260, "protein": 14, "fat": 9, "carbohydrates": 38}', '["томатный соус", "моцарелла", "ветчина", "ананасы"]', '["сырный бортик", "кукуруза", "чесночный соус"]'),
('Четыре сыра', 600.0, 'pizza', '/four_cheese.png', 'Пицца с четырьмя видами сыра', '{"calories": 320, "protein": 18, "fat": 16, "carbohydrates": 28}', '["томатный соус", "моцарелла", "горгонзола", "пармезан", "рикотта"]', '["сырный бортик", "орегано", "оливковое масло"]'),
('Мясная', 650.0, 'pizza', '/meat.png', 'Пицца с различными видами мяса', '{"calories": 350, "protein": 22, "fat": 18, "carbohydrates": 30}', '["томатный соус", "моцарелла", "пепперони", "ветчина", "бекон", "курица"]', '["сырный бортик", "острый соус", "двойная порция мяса"]'),
('Конструктор пиццы', 400.0, 'pizza_constructor', '/constructor.png', 'Создайте свою уникальную пиццу', '{"calories": 200, "protein": 10, "fat": 6, "carbohydrates": 25}', '["томатный соус", "моцарелла"]', '["ветчина", "пепперони", "курица", "грибы", "перец", "лук", "оливки", "ананасы", "кукуруза"]'),
('Картофель фри', 180.0, 'snack', '/fries.png', 'Хрустящий картофель фри с солью', '{"calories": 320, "protein": 4, "fat": 15, "carbohydrates": 42}', '["картофель", "соль", "растительное масло"]', '["сырный соус", "кетчуп", "майонез"]'),
('Наггетсы', 220.0, 'snack', '/nuggets.png', 'Куриные наггетсы в хрустящей панировке', '{"calories": 280, "protein": 16, "fat": 18, "carbohydrates": 12}', '["куриное филе", "панировка", "специи"]', '["сырный соус", "барбекю соус", "сметанный соус"]'),
('Кола', 120.0, 'drink', '/cola.png', 'Освежающий газированный напиток', '{"calories": 140, "protein": 0, "fat": 0, "carbohydrates": 35}', '["вода", "сахар", "ароматизаторы"]', '["лёд", "лимон"]'),
('Апельсиновый сок', 150.0, 'drink', '/orange_juice.png', 'Натуральный апельсиновый сок', '{"calories": 110, "protein": 2, "fat": 0, "carbohydrates": 26}', '["апельсиновый сок"]', '["лёд", "мята"]'),
('Вода', 80.0, 'drink', '/water.png', 'Очищенная питьевая вода', '{"calories": 0, "protein": 0, "fat": 0, "carbohydrates": 0}', '["вода"]', '["лёд", "лимон"]')
ON CONFLICT (id) DO NOTHING;
package database

import (
	"fmt"

	"fitcha/internal/models"
	"fitcha/internal/repositories"

	"gorm.io/gorm"
)

func SeedCatalogMachines(db *gorm.DB) error {
	repo := repositories.NewMachineRepository(db)

	machines := []models.Machine{
		// Peito
		catalogMachine(1, "supino-reto-barra", "Supino reto com barra", "Exercicio composto para peitoral, com foco em controle do movimento e estabilidade dos ombros.", "peito", "supino reto", "bench press", "press reto"),
		catalogMachine(2, "supino-inclinado-halteres", "Supino inclinado com halteres", "Variacao inclinada para peitoral superior, pedindo controle na descida e alinhamento dos cotovelos.", "peito", "supino inclinado", "incline dumbbell press"),
		catalogMachine(3, "crucifixo-maquina", "Crucifixo na maquina", "Isolamento de peitoral com amplitude controlada e foco na contracao final.", "peito", "peck deck", "fly maquina", "crucifixo"),
		catalogMachine(4, "supino-declinado-barra", "Supino declinado com barra", "Variacao para porcao inferior do peitoral, mantendo o trajeto estavel da barra.", "peito", "supino declinado", "decline bench press"),
		catalogMachine(5, "supino-inclinado-barra", "Supino inclinado com barra", "Press para peitoral superior com foco em firmeza escapular e controle da barra.", "peito", "incline bench press", "supino barra inclinado"),
		catalogMachine(6, "supino-reto-halteres", "Supino reto com halteres", "Movimento bilateral livre para peitoral, exigindo controle e amplitude equilibrada.", "peito", "dumbbell bench press", "supino halteres"),
		catalogMachine(7, "crucifixo-halteres", "Crucifixo com halteres", "Isolamento de peitoral com arco controlado e leve flexao dos cotovelos.", "peito", "dumbbell fly", "fly halteres"),
		catalogMachine(8, "crossover-polia-alta", "Crossover na polia alta", "Cruze de cabos com enfase em aducao horizontal e contracao do peitoral.", "peito", "crossover alto", "cable crossover"),
		catalogMachine(9, "crossover-polia-media", "Crossover na polia media", "Variacao de crossover com linha de forca mais horizontal para peitoral medio.", "peito", "crossover medio", "cross over"),
		catalogMachine(10, "crossover-polia-baixa", "Crossover na polia baixa", "Variacao de cabos com trajeto ascendente, favorecendo fibras superiores do peitoral.", "peito", "crossover baixo", "low cable fly"),
		catalogMachineNoWeight(11, "flexao-de-braco", "Flexao de braco", "Movimento com peso corporal para peitoral, ombros e triceps, com tronco alinhado.", "peito", "push up", "flexao"),
		catalogMachine(12, "chest-press-maquina", "Chest press na maquina", "Press guiado para peitoral com boa estabilidade e facilidade de progressao de carga.", "peito", "supino maquina", "press maquina"),
		catalogMachine(13, "pullover-halter", "Pullover com halter", "Exercicio acessorio que combina controle toracico e alongamento na fase excenctrica.", "peito", "pullover", "dumbbell pullover"),

		// Costas
		catalogMachine(14, "puxada-frontal", "Puxada frontal", "Exercicio para dorsais com foco em trazer a barra ao peito sem compensar com lombar.", "costas", "lat pulldown", "puxada alta", "pulldown"),
		catalogMachine(15, "remada-baixa", "Remada baixa", "Remada horizontal para costas medias, com enfase em retracao escapular.", "costas", "seated row", "remada sentada"),
		catalogMachine(16, "remada-curvada-barra", "Remada curvada com barra", "Movimento composto para costas e posterior de ombros, exigindo tronco firme durante toda a serie.", "costas", "barbell row", "remada barra"),
		catalogMachine(17, "puxada-supinada", "Puxada supinada", "Variacao de puxada com pegada supinada para dorsais e biceps.", "costas", "reverse grip pulldown", "pulldown supinado"),
		catalogMachine(18, "remada-unilateral-halter", "Remada unilateral com halter", "Trabalho unilateral para dorsais com foco em amplitude e estabilidade do tronco.", "costas", "one arm row", "remada unilateral"),
		catalogMachine(19, "remada-cavalinho", "Remada cavalinho", "Remada com apoio de quadril, favorecendo espessura de costas com boa estabilidade.", "costas", "t-bar row", "cavalinho"),
		catalogMachine(20, "puxada-neutra-triangulo", "Puxada neutra com triangulo", "Puxada com pegada neutra para dorsais, mantendo o peito aberto no movimento.", "costas", "neutral grip pulldown", "puxada triangulo"),
		catalogMachine(21, "remada-maquina-articulada", "Remada na maquina articulada", "Remada guiada com foco em retracao escapular e trajeto consistente.", "costas", "machine row", "remada articulada"),
		catalogMachineNoWeight(22, "barra-fixa", "Barra fixa", "Movimento com peso corporal para dorsais e biceps, com controle da escapula na subida.", "costas", "pull up", "barra"),
		catalogMachine(23, "pulldown-braco-reto", "Pulldown com braco reto", "Isolamento de dorsais no cabo, com pouca flexao de cotovelos e foco em depressao escapular.", "costas", "straight arm pulldown", "pullover no cabo"),
		catalogMachine(24, "remada-serrote", "Remada serrote", "Variacao de remada unilateral com apoio, priorizando amplitude e estabilidade.", "costas", "serrote", "supported one arm row"),
		catalogMachine(25, "puxada-fechada", "Puxada fechada", "Puxada vertical com pegada mais fechada para dorsais e redondos.", "costas", "close grip pulldown", "pulldown fechado"),
		catalogMachine(26, "remada-baixa-corda", "Remada baixa com corda", "Variacao de remada no cabo que favorece amplitude final e contracao das costas.", "costas", "cable row rope", "remada corda"),
		catalogMachine(101, "puxada-alta-aberta-pronada", "Puxada alta aberta pronada", "Puxada vertical com pegada aberta para dorsais, mantendo o tronco estavel e o peito elevado.", "costas", "puxada alta aberta", "wide grip lat pulldown"),
		catalogMachine(102, "puxada-alta-unilateral", "Puxada alta unilateral", "Puxada no cabo por um braco para trabalhar dorsais com ajuste fino de amplitude.", "costas", "single arm lat pulldown", "puxada unilateral"),
		catalogMachine(103, "remada-chest-supported", "Remada com peito apoiado", "Remada apoiada para costas medias, reduzindo a demanda da lombar e favorecendo a retracao escapular.", "costas", "chest supported row", "remada banco inclinado"),

		// Pernas
		catalogMachine(27, "agachamento-livre", "Agachamento livre", "Exercicio base para pernas, com foco em postura, profundidade segura e controle do core.", "pernas", "squat", "agachamento barra"),
		catalogMachine(28, "leg-press-45", "Leg press 45", "Empurrada para quadriceps e gluteos, mantendo os pes estaveis e sem tirar o quadril do banco.", "pernas", "leg press", "leg 45"),
		catalogMachine(29, "cadeira-extensora", "Cadeira extensora", "Isolamento de quadriceps com foco no controle da subida e da descida.", "pernas", "extensora", "leg extension"),
		catalogMachine(30, "mesa-flexora", "Mesa flexora", "Exercicio para posteriores de coxa com atencao ao encaixe do quadril no banco.", "pernas", "flexora", "leg curl"),
		catalogMachine(31, "cadeira-adutora", "Cadeira adutora", "Trabalho para adutores com amplitude controlada e postura estavel.", "pernas", "adutora", "adductor machine"),
		catalogMachine(32, "cadeira-abdutora", "Cadeira abdutora", "Exercicio para abdutores e gluteo medio com foco em controle da abertura.", "pernas", "abdutora", "abductor machine"),
		catalogMachine(33, "stiff-barra", "Stiff com barra", "Movimento para cadeia posterior com foco em quadril indo para tras e coluna neutra.", "pernas", "stiff", "romanian deadlift"),
		catalogMachine(34, "levantamento-terra-romeno", "Levantamento terra romeno", "Variacao de hinge para posteriores e gluteos com grande controle excenctrico.", "pernas", "rdl", "terra romeno"),
		catalogMachine(35, "afundo-halteres", "Afundo com halteres", "Exercicio unilateral para pernas e gluteos, exigindo equilibrio e controle do tronco.", "pernas", "lunge", "afundo"),
		catalogMachine(36, "passada-caminhando", "Passada caminhando", "Sequencia de passadas para quadriceps e gluteos, mantendo o passo estavel.", "pernas", "walking lunge", "passada"),
		catalogMachine(37, "agachamento-bulgaro", "Agachamento bulgaro", "Trabalho unilateral intenso para quadriceps e gluteos com apoio do pe traseiro.", "pernas", "bulgarian split squat", "bulgaro"),
		catalogMachine(38, "hack-squat", "Hack squat", "Agachamento guiado com foco em quadriceps e boa estabilidade de tronco.", "pernas", "hack", "hack machine"),
		catalogMachine(39, "agachamento-smith", "Agachamento no smith", "Variacao guiada para pernas, facilitando controle do trajeto e estabilidade.", "pernas", "smith squat", "agachamento guiado"),
		catalogMachine(40, "leg-press-horizontal", "Leg press horizontal", "Empurrada horizontal para quadriceps e gluteos com apoio completo do tronco.", "pernas", "horizontal leg press", "leg press horizontal"),
		catalogMachine(41, "cadeira-flexora", "Cadeira flexora", "Variacao sentada para posteriores de coxa, com foco em amplitude e controle.", "pernas", "seated leg curl", "flexora sentada"),
		catalogMachine(42, "gluteo-polia", "Gluteo na polia", "Extensao de quadril no cabo para gluteos, mantendo o tronco estavel.", "pernas", "kickback", "glute kickback"),
		catalogMachine(43, "elevacao-pelvica-barra", "Elevacao pelvica com barra", "Movimento dominante de quadril para gluteos, com pausa no topo e controle da lombar.", "pernas", "hip thrust", "ponte com barra"),
		catalogMachine(44, "panturrilha-em-pe", "Panturrilha em pe", "Exercicio para gemeos com pausa no pico de contracao e descida completa.", "pernas", "standing calf raise", "panturrilha"),

		// Ombros
		catalogMachine(45, "desenvolvimento-halteres", "Desenvolvimento com halteres", "Press vertical para ombros, mantendo o tronco firme e os halteres alinhados.", "ombros", "shoulder press", "desenvolvimento ombro"),
		catalogMachine(46, "elevacao-lateral", "Elevacao lateral", "Isolamento de deltoide lateral, com subida controlada e sem balanco de tronco.", "ombros", "lateral raise", "ombro lateral"),
		catalogMachine(47, "desenvolvimento-barra", "Desenvolvimento com barra", "Press vertical com barra para ombros, com foco em alinhamento e estabilidade.", "ombros", "overhead press", "military press"),
		catalogMachine(48, "desenvolvimento-maquina", "Desenvolvimento na maquina", "Variacao guiada para ombros, boa para progressao com estabilidade.", "ombros", "machine shoulder press", "press ombro maquina"),
		catalogMachine(49, "elevacao-frontal", "Elevacao frontal", "Exercicio acessorio para deltoide anterior com subida controlada.", "ombros", "front raise", "ombro frontal"),
		catalogMachine(50, "crucifixo-invertido-maquina", "Crucifixo invertido na maquina", "Trabalho para deltoide posterior e musculatura escapular com trajetoria guiada.", "ombros", "reverse fly", "posterior de ombro"),
		catalogMachine(51, "face-pull", "Face pull", "Movimento no cabo para deltoide posterior e rotadores externos, com foco em postura.", "ombros", "posterior no cabo", "rope face pull"),
		catalogMachine(52, "desenvolvimento-arnold", "Desenvolvimento Arnold", "Variacao de press com rotacao para ombros, exigindo controle do trajeto.", "ombros", "arnold press", "arnold"),
		catalogMachine(53, "elevacao-lateral-polia", "Elevacao lateral na polia", "Variacao unilateral que mantem tensao continua no deltoide lateral.", "ombros", "cable lateral raise", "lateral no cabo"),
		catalogMachine(54, "remada-alta", "Remada alta", "Movimento para deltoides e trapezio, com subida controlada e cotovelos guiando o gesto.", "ombros", "upright row", "high pull"),
		catalogMachine(55, "encolhimento-halteres", "Encolhimento com halteres", "Exercicio para trapezio, elevando os ombros sem compensar com pescoco.", "ombros", "dumbbell shrug", "shrug halteres"),
		catalogMachine(56, "encolhimento-barra", "Encolhimento com barra", "Variacao de trapezio com barra, favorecendo cargas maiores com controle.", "ombros", "barbell shrug", "shrug barra"),

		// Biceps
		catalogMachine(57, "rosca-direta-barra", "Rosca direta com barra", "Movimento classico para biceps, priorizando amplitude e controle sem roubar com lombar.", "biceps", "barbell curl", "rosca barra"),
		catalogMachine(58, "rosca-alternada-halteres", "Rosca alternada com halteres", "Trabalho unilateral de biceps com controle de supinacao e descida.", "biceps", "dumbbell curl", "rosca alternada"),
		catalogMachine(59, "rosca-scott", "Rosca Scott", "Variacao com apoio para reduzir compensacoes e aumentar foco no biceps.", "biceps", "preacher curl", "banco scott"),
		catalogMachine(60, "rosca-martelo", "Rosca martelo", "Exercicio para biceps e braquial com pegada neutra e controle do cotovelo.", "biceps", "hammer curl", "martelo"),
		catalogMachine(61, "rosca-concentrada", "Rosca concentrada", "Variacao unilateral com foco em pico de contracao e execucao estrita.", "biceps", "concentration curl", "concentrada"),
		catalogMachine(62, "rosca-cabo", "Rosca no cabo", "Rosca com tensao continua ao longo do movimento e boa estabilidade.", "biceps", "cable curl", "rosca polia"),
		catalogMachine(63, "rosca-21", "Rosca 21", "Metodo classico de alto volume, combinando amplitudes parciais e completas.", "biceps", "21s", "vinte e um"),
		catalogMachine(64, "rosca-inclinada-halteres", "Rosca inclinada com halteres", "Rosca em banco inclinado para alongamento do biceps e controle excenctrico.", "biceps", "incline dumbbell curl", "rosca inclinada"),
		catalogMachine(65, "rosca-inversa-barra", "Rosca inversa com barra", "Variacao pronada que enfatiza antebraco e braquiorradial.", "biceps", "reverse curl", "rosca pronada"),
		catalogMachine(66, "rosca-unilateral-polia", "Rosca unilateral na polia", "Trabalho isolado com cabo, mantendo tensao constante e ajuste fino de angulo.", "biceps", "single arm cable curl", "rosca unilateral"),

		// Triceps
		catalogMachine(67, "triceps-corda", "Triceps corda", "Extensao para triceps na polia, enfatizando extensao total e abertura final da corda.", "triceps", "pushdown corda", "triceps pulley"),
		catalogMachine(68, "triceps-testa-barra", "Triceps testa com barra", "Exercicio para cabeca longa do triceps, com cuidado para manter os cotovelos alinhados.", "triceps", "skull crusher", "triceps testa"),
		catalogMachine(69, "triceps-frances-halter", "Triceps frances com halter", "Movimento acima da cabeca para triceps, com foco em amplitude e controle.", "triceps", "overhead dumbbell extension", "frances"),
		catalogMachineNoWeight(70, "triceps-banco", "Triceps no banco", "Exercicio com peso corporal para triceps, mantendo o quadril proximo ao banco.", "triceps", "bench dips", "mergulho banco"),
		catalogMachine(71, "supino-fechado", "Supino fechado", "Variacao de press que aumenta a participacao do triceps sem perder estabilidade.", "triceps", "close grip bench press", "bench fechado"),
		catalogMachineNoWeight(72, "mergulho-paralelas", "Mergulho nas paralelas", "Movimento composto para triceps e peitoral, exigindo bom controle corporal.", "triceps", "dips", "paralelas"),
		catalogMachine(73, "triceps-polia-barra-reta", "Triceps na polia com barra reta", "Extensao no cabo com pegada firme e foco em extensao completa do cotovelo.", "triceps", "straight bar pushdown", "triceps barra reta"),
		catalogMachine(74, "triceps-unilateral-polia", "Triceps unilateral na polia", "Variacao unilateral que ajuda a ajustar tecnica e equilibrio entre os lados.", "triceps", "single arm pushdown", "triceps unilateral"),
		catalogMachine(75, "extensao-triceps-acima-cabeca-corda", "Extensao de triceps acima da cabeca com corda", "Movimento no cabo para cabeca longa do triceps com boa tensao em alongamento.", "triceps", "overhead rope extension", "triceps overhead"),
		catalogMachine(76, "coice-triceps", "Coice de triceps", "Exercicio acessorio para triceps com foco em extensao total e cotovelo fixo.", "triceps", "triceps kickback", "coice"),

		// Antebraco
		catalogMachineNoWeight(104, "flexao-punho-halter", "Flexao de punho com halter", "Flexao controlada do punho para musculatura flexora do antebraco.", "antebraco", "wrist curl", "rosca punho"),
		catalogMachineNoWeight(105, "extensao-punho-halter", "Extensao de punho com halter", "Extensao controlada do punho para musculatura extensora do antebraco.", "antebraco", "reverse wrist curl", "extensao punho"),
		catalogMachine(106, "rosca-inversa-cabo", "Rosca inversa no cabo", "Rosca pronada com tensao continua para braquiorradial e extensores do antebraco.", "antebraco", "cable reverse curl", "rosca pronada polia"),
		catalogMachineNoWeight(107, "farmer-walk", "Caminhada do fazendeiro", "Caminhada carregada para pegada, estabilidade de tronco e resistencia do antebraco.", "antebraco", "farmer carry", "farmer walk"),
		catalogMachineNoWeight(108, "dead-hang", "Suspensao na barra", "Suspensao estatica para desenvolver resistencia de pegada e antebracos.", "antebraco", "bar hang", "dead hang"),

		// Core
		catalogMachineDuration(77, "prancha", "Prancha", "Exercicio isometrico para core com foco em alinhamento corporal e respiracao.", "core", "plank", "prancha abdominal"),
		catalogMachine(78, "abdominal-cabo", "Abdominal no cabo", "Flexao de tronco no cabo para core, com foco em encurtamento controlado e sem puxar com os bracos.", "core", "cable crunch", "abdominal polia"),
		catalogMachine(79, "abdominal-maquina", "Abdominal na maquina", "Movimento guiado para reto abdominal com boa estabilidade e ajuste de carga.", "core", "ab crunch machine", "maquina abdominal"),
		catalogMachineNoWeight(80, "elevacao-pernas-barra", "Elevacao de pernas na barra", "Exercicio para abdome inferior e flexores de quadril com forte demanda de controle corporal.", "core", "leg raise", "barra abdominal"),
		catalogMachineNoWeight(81, "elevacao-joelhos-paralela", "Elevacao de joelhos na paralela", "Variacao de core com apoio, focando em flexao de quadril e estabilizacao do tronco.", "core", "knee raise", "paralela abdominal"),
		catalogMachineDuration(82, "prancha-lateral", "Prancha lateral", "Isometria para obliquos e estabilidade lateral do tronco.", "core", "side plank", "lateral plank"),
		catalogMachineNoWeight(83, "crunch-solo", "Crunch no solo", "Abdominal classico com foco em flexao de tronco controlada e sem puxar o pescoco.", "core", "crunch", "abdominal solo"),
		catalogMachineNoWeight(84, "bicicleta-no-ar", "Bicicleta no ar", "Movimento dinamico para reto abdominal e obliquos com alternancia coordenada.", "core", "bicycle crunch", "bicicleta abdominal"),
		catalogMachineNoWeight(85, "abdominal-infra-banco", "Abdominal infra no banco", "Variacao para porcao inferior do abdome com apoio e controle da pelve.", "core", "reverse crunch bench", "infra banco"),
		catalogMachine(86, "hiperextensao-lombar", "Hiperextensao lombar", "Exercicio para cadeia posterior e estabilizacao do tronco com foco em amplitude segura.", "core", "back extension", "lombar banco romano"),

		// Cardio
		catalogMachineDuration(87, "esteira", "Esteira", "Cardio para caminhada ou corrida com controle de ritmo e postura.", "cardio", "treadmill", "corrida esteira"),
		catalogMachineDuration(88, "bicicleta-ergometrica", "Bicicleta ergometrica", "Cardio de baixo impacto para condicionamento e aquecimento.", "cardio", "bike", "bicicleta", "spinning"),
		catalogMachineDuration(89, "eliptico", "Eliptico", "Cardio continuo com baixo impacto articular e foco em ritmo sustentavel.", "cardio", "elliptical", "transport"),
		catalogMachineDuration(90, "escada", "Escada", "Equipamento de subida continua para condicionamento e trabalho de pernas.", "cardio", "stair climber", "stepmill"),
		catalogMachineDuration(91, "remo-ergometro", "Remo ergometro", "Cardio que combina membros superiores e inferiores com foco em tecnica e cadencia.", "cardio", "rowing machine", "remo"),
		catalogMachineDuration(92, "air-bike", "Air bike", "Bicicleta de resistencia ao ar para tiros intensos ou protocolos intervalados.", "cardio", "assault bike", "fan bike"),
		catalogMachineDuration(93, "bicicleta-spinning", "Bicicleta de spinning", "Modalidade de bike indoor com foco em cadencia, resistencia e condicionamento.", "cardio", "spin bike", "spinning"),
		catalogMachineDuration(94, "bicicleta-horizontal", "Bicicleta horizontal", "Bike reclinada de baixo impacto, boa para volume cardio com mais conforto.", "cardio", "recumbent bike", "bike horizontal"),
		catalogMachineDuration(95, "caminhada-inclinada-esteira", "Caminhada inclinada na esteira", "Variacao de cardio com foco em intensidade moderada e trabalho de gluteos e panturrilhas.", "cardio", "incline walk", "caminhada inclinada"),
		catalogMachineDuration(96, "corrida-intervalada-esteira", "Corrida intervalada na esteira", "Protocolo de tiros na esteira para ganho de capacidade cardiovascular.", "cardio", "hiit treadmill", "tiros na esteira"),
		catalogMachineDuration(97, "ski-erg", "Ski erg", "Cardio de tracao vertical com forte demanda de tronco, ombros e condicionamento.", "cardio", "skierg", "ski machine"),
		catalogMachineDuration(98, "transport", "Transport", "Equipamento de cardio com passada guiada e baixo impacto articular.", "cardio", "glider", "simulador de caminhada"),
		catalogMachineDuration(99, "pular-corda", "Pular corda", "Cardio dinamico para coordenacao, agilidade e resistencia.", "cardio", "jump rope", "corda"),
		catalogMachineDuration(100, "battle-rope", "Battle rope", "Condicionamento metabolico com cordas, exigindo potencia e ritmo de membros superiores.", "cardio", "corda naval", "ropes"),
	}

	applyCatalogSubstitutionGroups(machines)
	return repo.UpsertMany(machines)
}

func applyCatalogSubstitutionGroups(machines []models.Machine) {
	groups := map[string][]string{
		"chest_upper_press":          {"supino-inclinado-halteres", "supino-inclinado-barra"},
		"chest_mid_press":            {"supino-reto-barra", "supino-reto-halteres", "chest-press-maquina"},
		"chest_mid_fly":              {"crucifixo-maquina", "crucifixo-halteres", "crossover-polia-media"},
		"back_vertical_pull":         {"puxada-frontal", "puxada-supinada", "puxada-neutra-triangulo", "barra-fixa", "puxada-fechada", "puxada-alta-aberta-pronada", "puxada-alta-unilateral"},
		"back_horizontal_row":        {"remada-baixa", "remada-curvada-barra", "remada-unilateral-halter", "remada-cavalinho", "remada-maquina-articulada", "remada-serrote", "remada-baixa-corda", "remada-chest-supported"},
		"quad_compound":              {"agachamento-livre", "leg-press-45", "hack-squat", "agachamento-smith", "leg-press-horizontal"},
		"hamstring_knee_flexion":     {"mesa-flexora", "cadeira-flexora"},
		"hip_hinge":                  {"stiff-barra", "levantamento-terra-romeno"},
		"glute_hip_extension":        {"gluteo-polia", "elevacao-pelvica-barra"},
		"shoulder_vertical_press":    {"desenvolvimento-halteres", "desenvolvimento-barra", "desenvolvimento-maquina", "desenvolvimento-arnold"},
		"lateral_delt_raise":         {"elevacao-lateral", "elevacao-lateral-polia"},
		"biceps_supinated_curl":      {"rosca-direta-barra", "rosca-alternada-halteres", "rosca-scott", "rosca-concentrada", "rosca-cabo", "rosca-unilateral-polia", "rosca-inclinada-halteres"},
		"triceps_pushdown":           {"triceps-corda", "triceps-polia-barra-reta", "triceps-unilateral-polia"},
		"triceps_overhead_extension": {"triceps-frances-halter", "extensao-triceps-acima-cabeca-corda", "triceps-testa-barra"},
		"core_trunk_flexion":         {"abdominal-cabo", "abdominal-maquina", "crunch-solo"},
		"cardio_bike":                {"bicicleta-ergometrica", "bicicleta-spinning", "bicicleta-horizontal", "air-bike"},
		"cardio_treadmill":           {"esteira", "caminhada-inclinada-esteira", "corrida-intervalada-esteira"},
		"forearm_pronated_curl":      {"rosca-inversa-barra", "rosca-inversa-cabo"},
		"forearm_grip":               {"farmer-walk", "dead-hang"},
	}

	bySlug := make(map[string]string)
	for group, slugs := range groups {
		for _, slug := range slugs {
			bySlug[slug] = group
		}
	}
	for index := range machines {
		machines[index].SubstitutionGroup = bySlug[machines[index].Slug]
	}
}

func catalogMachine(id int, slug, name, description, categoryKey string, aliases ...string) models.Machine {
	return models.Machine{
		ID:             fmt.Sprintf("mach%012d", id),
		Slug:           slug,
		Name:           name,
		Description:    description,
		CategoryKey:    categoryKey,
		TrackingType:   string(models.MachineTrackingTypeSets),
		RequiresWeight: true,
		Aliases:        models.StringList(aliases),
	}
}

func catalogMachineNoWeight(id int, slug, name, description, categoryKey string, aliases ...string) models.Machine {
	machine := catalogMachine(id, slug, name, description, categoryKey, aliases...)
	machine.RequiresWeight = false
	return machine
}

func catalogMachineDuration(id int, slug, name, description, categoryKey string, aliases ...string) models.Machine {
	machine := catalogMachine(id, slug, name, description, categoryKey, aliases...)
	machine.TrackingType = string(models.MachineTrackingTypeDuration)
	machine.RequiresWeight = false
	return machine
}
